import { getReminderFunctionName, getVapidPublicKey, isCloudSyncConfigured, isPushConfigured } from '../config.js';
import { getSupabaseClient } from './cloudSync.js';
import { getGameStateInstance, getSettingsStateInstance } from '../../bootstrap.js';
import { recordEvent } from '../analytics.js';
const LOW_STAT_MESSAGES = {
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
export function notificationsSupported() {
    return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}
export async function enableNotifications() {
    if (!notificationsSupported()) {
        getSettingsStateInstance().updateNotificationSettings({
            permission: 'denied',
            enabled: false
        });
        return false;
    }
    const currentPermission = Notification.permission;
    if (currentPermission === 'granted') {
        getSettingsStateInstance().updateNotificationSettings({
            permission: 'granted',
            enabled: true
        });
        await ensurePushSubscription();
        return true;
    }
    // markNotificationPrompted(); // Was in state.ts. We can track this in SettingsState if needed.
    // For now, let's assume we just update lastPromptAt in SettingsState.
    getSettingsStateInstance().updateNotificationSettings({ lastPromptAt: Date.now() });
    const permission = await Notification.requestPermission();
    getSettingsStateInstance().updateNotificationSettings({
        permission: permission,
        enabled: permission === 'granted'
    });
    if (permission === 'granted') {
        await ensurePushSubscription();
        recordEvent('notifiche:abilitate');
        return true;
    }
    recordEvent('notifiche:negate');
    return false;
}
export async function disableNotifications() {
    getSettingsStateInstance().updateNotificationSettings({
        enabled: false,
        subscriptionId: null
    });
    if (!notificationsSupported()) {
        return;
    }
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await subscription.unsubscribe();
            void removeSubscriptionFromSupabase(subscription).catch(() => undefined);
        }
    }
    catch (error) {
        console.warn('Impossibile annullare la sottoscrizione push', error);
    }
}
export async function notifyLowStat(stat) {
    const settings = getSettingsStateInstance().getSettings();
    if (!settings.notifications.enabled || settings.notifications.permission !== 'granted') {
        return;
    }
    const lastSent = settings.notifications.lastSent[stat] ?? 0;
    if (Date.now() - lastSent < REMINDER_COOLDOWN_MS) {
        return;
    }
    if (!notificationsSupported()) {
        return;
    }
    const registration = await navigator.serviceWorker.ready;
    const message = LOW_STAT_MESSAGES[stat];
    try {
        await registration.showNotification(message.title, {
            body: message.body,
            icon: 'icons/icon-192.png',
            badge: 'icons/icon-192.png',
            tag: `low-${stat}`,
            data: { stat }
        });
        recordEvent(`notifiche:${stat}`);
    }
    catch (error) {
        console.warn('Impossibile mostrare la notifica locale', error);
    }
    // markNotificationSent(stat);
    const lastSentUpdate = { ...settings.notifications.lastSent, [stat]: Date.now() };
    getSettingsStateInstance().updateNotificationSettings({ lastSent: lastSentUpdate });
    void triggerRemoteReminder(stat).catch(() => undefined);
}
async function ensurePushSubscription() {
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
                applicationServerKey: serverKey
            });
        }
        catch (error) {
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
async function persistSubscription(subscription) {
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
    }
    catch (error) {
        console.warn('Impossibile salvare la sottoscrizione su Supabase', error);
    }
}
async function removeSubscriptionFromSupabase(subscription) {
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
    }
    catch (error) {
        console.warn('Impossibile eliminare la sottoscrizione da Supabase', error);
    }
}
async function triggerRemoteReminder(stat) {
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
    }
    catch (error) {
        console.warn('Edge function reminder fallita', error);
    }
}
function base64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
async function hashEndpoint(endpoint) {
    const encoder = new TextEncoder();
    const data = encoder.encode(endpoint);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const view = new DataView(hash);
    const bytes = new Uint8Array(view.buffer);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
function resolveSyncRecordId() {
    return getGameStateInstance().getPlayerId();
}
