import { audioManager } from '../../core/audio.js';
import { getGameStateInstance, getGameServiceInstance } from '../../bootstrap.js';
import { NativeService } from '../../core/native.js';
import { NotificationType } from '@capacitor/haptics';
import { SceneContext } from './SceneContext.js';

export class DenScene {
    constructor(private ctx: SceneContext) { }

    public init(): void {
        const lantern = document.getElementById('denLantern');
        if (!lantern) return;

        // Force initial audio context resume on user interaction to ensure audio starts
        document.body.addEventListener('click', () => {
            if (audioManager['context']?.state === 'suspended') {
                void audioManager.resume();
            }
        }, { once: true });

        // Sync initial state from GameState
        let isNight = getGameStateInstance().getIsSleeping();
        if (isNight) {
            document.body.classList.add('night-mode');
        } else {
            // Goodnight Reminder Check (Soul)
            const hour = new Date().getHours();
            if ((hour >= 22 || hour < 5)) {
                const reminderKey = `pebble_sleep_reminded_${new Date().toDateString()}`;
                if (!localStorage.getItem(reminderKey)) {
                    setTimeout(() => {
                        this.ctx.notificationUI.showAlert('Si è fatto tardi, Pebble ha sonno...', 'info');
                        localStorage.setItem(reminderKey, 'true');
                    }, 3000);
                }
            }
        }

        lantern.addEventListener('click', () => {
            isNight = !isNight;

            if (isNight) {
                // Goodnight
                getGameServiceInstance().sleep();
                // Trigger sleep animation
                this.ctx.otterRenderer.triggerAnimation('sleep', getGameStateInstance().getEquipped(), () => { });
                document.body.classList.add('night-mode');
                this.ctx.notificationUI.showAlert('Buonanotte, Pebble...', 'info');
                if (NativeService.isNative()) {
                    void NativeService.haptics.vibrate();
                } else if (navigator.vibrate) navigator.vibrate(50);
            } else {
                // Good morning
                getGameServiceInstance().wakeUp();
                document.body.classList.remove('night-mode');

                // Just let the mood sync handle the visual state (happy/neutral)
                // removing explicit 'feed' animation which looked like eating.

                this.ctx.notificationUI.showAlert('Buongiorno!', 'info');
                this.ctx.notificationUI.showAlert('Buongiorno!', 'info');
                void NativeService.haptics.notification(NotificationType.Success);

                void audioManager.playSFX('happy', true);
            }
        });

        // Secret Moon Logic
        const moon = document.getElementById('secretMoon');
        let moonClicks = 0;
        if (moon) {
            moon.addEventListener('click', () => {
                moonClicks++;
                void NativeService.haptics.impact();

                // Subtle feedback per click
                moon.style.transform = `scale(${1 + moonClicks * 0.1})`;

                if (moonClicks >= 5) {
                    moonClicks = 0;
                    moon.style.display = 'none'; // Poof

                    void NativeService.haptics.notification(NotificationType.Success);
                    void audioManager.playSFX('happy', true);

                    getGameServiceInstance().spendCoins(-50); // Hack to ADD coins: spend -50.

                    const gs = getGameStateInstance();
                    const stats = gs.getStats();
                    gs.setStats({ seaGlass: stats.seaGlass + 50 });

                    this.ctx.notificationUI.showAlert('Hai scoperto un segreto lunare! (+50 💎)', 'success');
                }
            });
        }
    }
}
