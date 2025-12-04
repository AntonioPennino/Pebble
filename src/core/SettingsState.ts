import { ThemeMode, NotificationSettings } from './types.js';
import { IStorageService } from './interfaces/IStorageService.js';

const SETTINGS_KEY = 'pebble:settings:v1';

export interface LocalSettings {
    theme: ThemeMode;
    notifications: NotificationSettings;
    tutorialSeen: boolean;
    analyticsOptIn: boolean;
    installPromptDismissed: boolean;
    analytics: {
        events: Record<string, number>;
        lastEventAt: string | null;
    };
}

const DEFAULT_SETTINGS: LocalSettings = {
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
    private settings: LocalSettings;
    private listeners: Array<(settings: LocalSettings) => void> = [];

    constructor(private storageService: IStorageService) {
        this.settings = this.loadSettings();
        if (!this.settings.notifications.clientId) {
            this.settings.notifications.clientId = this.generateClientId();
            this.saveSettings();
        }
    }

    public getSettings(): LocalSettings {
        return { ...this.settings };
    }

    public updateSettings(partial: Partial<LocalSettings>): void {
        this.settings = { ...this.settings, ...partial };
        this.saveSettings();
        this.notifyListeners();
    }

    public updateNotificationSettings(partial: Partial<NotificationSettings>): void {
        this.settings.notifications = { ...this.settings.notifications, ...partial };
        this.saveSettings();
        this.notifyListeners();
    }

    public subscribe(listener: (settings: LocalSettings) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private loadSettings(): LocalSettings {
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
        } catch (error) {
            console.warn('Failed to load settings, using defaults', error);
            return { ...DEFAULT_SETTINGS };
        }
    }

    private saveSettings(): void {
        this.storageService.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.settings));
    }

    private generateClientId(): string {
        const buffer = new Uint8Array(8);
        crypto.getRandomValues(buffer);
        return Array.from(buffer, byte => byte.toString(16).padStart(2, '0')).join('');
    }
}
