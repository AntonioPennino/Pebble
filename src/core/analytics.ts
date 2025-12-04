import { getSettingsStateInstance } from '../bootstrap.js';
import { GameState } from './types.js';

export function recordEvent(name: string): void {
  const settingsState = getSettingsStateInstance();
  const settings = settingsState.getSettings();

  if (!settings.analyticsOptIn) {
    return;
  }

  // We need to update the analytics events in SettingsState.
  // Currently SettingsState manages: theme, notifications, tutorialSeen, analyticsOptIn, installPromptDismissed.
  // It does NOT seem to manage the actual analytics data (events list).
  // The legacy state.ts had 'analytics' object with 'events'.
  // We should add 'analytics' to SettingsState or a separate AnalyticsState?
  // Given it's local data about usage, SettingsState seems appropriate or we can add it there.
  // Let's check SettingsState definition.

  // For now, let's assume we can add it to SettingsState or just log it if we don't want to persist it strictly yet.
  // But the user wants feature parity.
  // Let's update SettingsState to include analytics data.

  const currentEvents = settings.analytics?.events || {};
  const newEvents = { ...currentEvents, [name]: (currentEvents[name] || 0) + 1 };

  settingsState.updateSettings({
    analytics: {
      events: newEvents,
      lastEventAt: new Date().toISOString()
    }
  });
}

export function getAnalyticsSummary(): string {
  const settings = getSettingsStateInstance().getSettings();
  const events = settings.analytics?.events || {};
  const keys = Object.keys(events);
  if (keys.length === 0) {
    return 'Nessun evento registrato.';
  }

  return keys
    .map(key => `${key}: ${events[key]}`)
    .join(', ');
}
