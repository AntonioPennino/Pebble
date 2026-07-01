import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';

export const isNative = Capacitor.isNativePlatform();

export const NativeService = {
    isNative: () => isNative,

    // --- Haptics ---
    haptics: {
        impact: async (style: ImpactStyle = ImpactStyle.Medium) => {
            if (isNative) {
                await Haptics.impact({ style });
            } else {
                // Web Fallback
                if (navigator.vibrate) {
                    switch (style) {
                        case ImpactStyle.Light: navigator.vibrate(10); break;
                        case ImpactStyle.Medium: navigator.vibrate(20); break;
                        case ImpactStyle.Heavy: navigator.vibrate(40); break;
                        default: navigator.vibrate(20);
                    }
                }
            }
        },
        notification: async (type: NotificationType) => {
            if (isNative) {
                await Haptics.notification({ type });
            } else {
                if (navigator.vibrate) {
                    switch (type) {
                        case NotificationType.Success: navigator.vibrate([20, 50, 20]); break;
                        case NotificationType.Warning: navigator.vibrate([50, 50]); break;
                        case NotificationType.Error: navigator.vibrate([50, 50, 100]); break;
                    }
                }
            }
        },
        vibrate: async (duration: number = 20) => {
            if (isNative) {
                await Haptics.vibrate({ duration });
            } else {
                if (navigator.vibrate) navigator.vibrate(duration);
            }
        }
    },

    // --- Notifications ---
    notifications: {
        requestPermissions: async (): Promise<boolean> => {
            if (isNative) {
                const result = await LocalNotifications.requestPermissions();
                return result.display === 'granted';
            } else {
                const result = await Notification.requestPermission();
                return result === 'granted';
            }
        },

        schedule: async (options: {
            id: number;
            title: string;
            body: string;
            scheduleAt?: Date;
            sound?: string;
        }) => {
            if (isNative) {
                await LocalNotifications.schedule({
                    notifications: [{
                        title: options.title,
                        body: options.body,
                        id: options.id,
                        schedule: options.scheduleAt ? { at: options.scheduleAt } : undefined,
                        sound: options.sound ?? undefined,
                        smallIcon: 'ic_stat_icon_config_sample' // Default icon resource name if configured, else capacitor will fallback
                    }]
                });
            } else {
                // Web Fallback: Handled by Service Worker logic or immediate notification if no schedule
                // For web, scheduling is tricky without Push. We usually just fire immediately if scheduleAt is close or null.
                if (!options.scheduleAt || options.scheduleAt.getTime() - Date.now() < 1000) {
                    if (Notification.permission === 'granted') {
                        new Notification(options.title, { body: options.body, icon: '/icons/icon-192.png' });
                    }
                } else {
                    // Web scheduling not robustly supported without Push/ServiceWorker sync.
                    // Leaving blank/log for now as this is a known web limitation we accept.
                    console.log('[NativeService] Web scheduling not fully supported locally.', options);
                }
            }
        }
    }
};
