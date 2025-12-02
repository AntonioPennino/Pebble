const SETTINGS_KEY = 'pebble:settings:v1';
const DEFAULT_SETTINGS = {
    theme: 'light',
    notifications: {
        enabled: false,
        permission: 'default',
        lastPromptAt: null,
        subscriptionId: null,
        clientId: '', // Will be generated if empty
        lastSent: {
            hunger: undefined,
            happy: undefined,
            clean: undefined,
            energy: undefined
        }
    },
    tutorialSeen: false,
    analyticsOptIn: false,
    installPromptDismissed: false,
    analytics: {
        events: {},
        lastEventAt: null
    }
};
export class SettingsState {
    constructor(storageService) {
        this.storageService = storageService;
        this.listeners = [];
        this.settings = this.loadSettings();
        if (!this.settings.notifications.clientId) {
            this.settings.notifications.clientId = this.generateClientId();
            this.saveSettings();
        }
    }
    getSettings() {
        return { ...this.settings };
    }
    updateSettings(partial) {
        this.settings = { ...this.settings, ...partial };
        this.saveSettings();
        this.notifyListeners();
    }
    updateNotificationSettings(partial) {
        this.settings.notifications = { ...this.settings.notifications, ...partial };
        this.saveSettings();
        this.notifyListeners();
    }
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    loadSettings() {
        const raw = this.storageService.getItem(SETTINGS_KEY);
        if (!raw) {
            return { ...DEFAULT_SETTINGS };
        }
        try {
            const parsed = JSON.parse(raw);
            return {
                ...DEFAULT_SETTINGS,
                ...parsed,
                notifications: {
                    ...DEFAULT_SETTINGS.notifications,
                    ...(parsed.notifications || {})
                },
                analytics: {
                    ...DEFAULT_SETTINGS.analytics,
                    ...(parsed.analytics || {})
                }
            };
        }
        catch (error) {
            console.warn('Failed to load settings, using defaults', error);
            return { ...DEFAULT_SETTINGS };
        }
    }
    saveSettings() {
        this.storageService.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    }
    notifyListeners() {
        this.listeners.forEach(listener => listener(this.settings));
    }
    generateClientId() {
        const buffer = new Uint8Array(8);
        crypto.getRandomValues(buffer);
        return Array.from(buffer, byte => byte.toString(16).padStart(2, '0')).join('');
    }
}
