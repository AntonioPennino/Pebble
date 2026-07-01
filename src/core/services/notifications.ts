import { getReminderFunctionName, getVapidPublicKey, isCloudSyncConfigured, isPushConfigured } from '../config.js';
import { getSupabaseClient } from './cloudSync.js';
import { getGameStateInstance, getSettingsStateInstance } from '../../bootstrap.js';
import { recordEvent } from '../analytics.js';
import { NotificationSettings } from '../types.js';

const LOW_STAT_MESSAGES: Record<'hunger' | 'happy' | 'clean' | 'energy', { title: string; body: string }> = {
  hunger: {
    title: 'La lontra ha fame',
    body: 'Passa a nutrirla: uno snack la renderà felice!'
  },
  happy: {
    title: 'La lontra è giù di morale',
    body: 'Falle fare un gioco o un abbraccio con la palla!'
  },
  clean: {
    title: 'Tempo di bagnetto',
    body: 'La tua lontra preferisce essere profumata. Portala a lavarsi!'
  },
  energy: {
    title: 'Serve un pisolino',
    body: 'La lontra è stanchissima… mettila a dormire per recuperare energia.'
  }
};

const REMINDER_COOLDOWN_MS = 30 * 60 * 1000; // 30 minuti

import { NativeService } from '../native.js'; // Import NativeService

export function notificationsSupported(): boolean {
  return NativeService.isNative() || (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator);
}

export async function enableNotifications(): Promise<boolean> {
  const granted = await NativeService.notifications.requestPermissions();

  getSettingsStateInstance().updateNotificationSettings({
    permission: granted ? 'granted' : 'denied',
    enabled: granted
  });

  if (granted) {
    if (!NativeService.isNative()) {
      await ensurePushSubscription(); // Web Push only for now
    }
    recordEvent('notifiche:abilitate');
    return true;
  }

  recordEvent('notifiche:negate');
  return false;
}

export async function disableNotifications(): Promise<void> {
  getSettingsStateInstance().updateNotificationSettings({
    enabled: false,
    subscriptionId: null
  });

  if (!notificationsSupported()) {
    return;
  }

  // Native: maybe cancel scheduled ones?
  if (NativeService.isNative()) {
    // Logic to clear local notifications if needed
    // await NativeService.notifications.clear(); // If implemented
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      void removeSubscriptionFromSupabase(subscription).catch(() => undefined);
    }
  } catch (error) {
    console.warn('Impossibile annullare la sottoscrizione push', error);
  }
}

export async function notifyLowStat(stat: 'hunger' | 'happy' | 'clean' | 'energy'): Promise<void> {
  const settings = getSettingsStateInstance().getSettings();
  if (!settings.notifications.enabled) return;

  const lastSent = settings.notifications.lastSent[stat] ?? 0;
  if (Date.now() - lastSent < REMINDER_COOLDOWN_MS) return;

  const message = LOW_STAT_MESSAGES[stat];

  // Use NativeService
  await NativeService.notifications.schedule({
    id: Math.floor(Math.random() * 10000), // Random ID for now
    title: message.title,
    body: message.body
  });

  // Track
  const lastSentUpdate = { ...settings.notifications.lastSent, [stat]: Date.now() };
  getSettingsStateInstance().updateNotificationSettings({ lastSent: lastSentUpdate });

  // Remote trigger (Web fallback / Cloud logic)
  if (!NativeService.isNative()) {
    void triggerRemoteReminder(stat).catch(() => undefined);
  }
}

async function ensurePushSubscription(): Promise<void> {
  if (!notificationsSupported()) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  const vapidKey = getVapidPublicKey();
  if (!subscription && isPushConfigured() && vapidKey) {
    try {
      const serverKey = base64ToUint8Array(vapidKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: serverKey as unknown as BufferSource
      });
    } catch (error) {
      console.warn('Impossibile sottoscriversi alle push', error);
      return;
    }
  }

  if (!subscription) {
    return;
  }

  getSettingsStateInstance().updateNotificationSettings({ enabled: true });

  await persistSubscription(subscription);
}

async function persistSubscription(subscription: PushSubscription): Promise<void> {
  if (!isCloudSyncConfigured()) {
    return;
  }
  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }

  const json = subscription.toJSON();
  if (!json.endpoint) {
    return;
  }

  const id = await hashEndpoint(json.endpoint);
  const settings = getSettingsStateInstance().getSettings();
  const payload = {
    id,
    client_id: settings.notifications.clientId,
    record_id: resolveSyncRecordId(),
    endpoint: json.endpoint,
    subscription: json,
    updated_at: new Date().toISOString()
  };

  try {
    await supabase.from('otter_push_subscriptions').upsert(payload, { onConflict: 'id' });
    getSettingsStateInstance().updateNotificationSettings({ subscriptionId: id });
  } catch (error) {
    console.warn('Impossibile salvare la sottoscrizione su Supabase', error);
  }
}

async function removeSubscriptionFromSupabase(subscription: PushSubscription): Promise<void> {
  if (!isCloudSyncConfigured()) {
    return;
  }
  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }
  const endpoint = subscription.endpoint;
  const id = await hashEndpoint(endpoint);
  try {
    await supabase
      .from('otter_push_subscriptions')
      .delete()
      .eq('id', id)
      .eq('client_id', getSettingsStateInstance().getSettings().notifications.clientId);
  } catch (error) {
    console.warn('Impossibile eliminare la sottoscrizione da Supabase', error);
  }
}

async function triggerRemoteReminder(stat: 'hunger' | 'happy' | 'clean' | 'energy'): Promise<void> {
  const reminderFunction = getReminderFunctionName();
  if (!reminderFunction || !isCloudSyncConfigured()) {
    return;
  }
  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }
  const settings = getSettingsStateInstance().getSettings();
  const gameState = getGameStateInstance();
  try {
    await supabase.functions.invoke(reminderFunction, {
      body: {
        stat,
        petName: gameState.getPetName(),
        recordId: resolveSyncRecordId(),
        clientId: settings.notifications.clientId,
        subscriptionId: settings.notifications.subscriptionId
      }
    });
  } catch (error) {
    console.warn('Edge function reminder fallita', error);
  }
}

function base64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function hashEndpoint(endpoint: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(endpoint);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const view = new DataView(hash);
  const bytes = new Uint8Array(view.buffer);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function resolveSyncRecordId(): string {
  return getGameStateInstance().getPlayerId();
}