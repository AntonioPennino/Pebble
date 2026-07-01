import { audioManager } from '../../core/audio.js';
import { getGameStateInstance, getGameServiceInstance } from '../../bootstrap.js';
import { NativeService } from '../../core/native.js';
import { SceneContext } from './SceneContext.js';

export class HygieneScene {
    constructor(private ctx: SceneContext) { }

    public init(): void {
        const sponge = document.getElementById('sponge');
        const otterContainer = document.querySelector('.hygiene-otter');

        if (!sponge || !otterContainer) return;

        // Touch logic for rubbing
        sponge.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];

            const ghost = sponge.cloneNode(true) as HTMLElement;
            ghost.style.position = 'fixed';
            ghost.style.zIndex = '1000';
            document.body.appendChild(ghost);

            let lastX = touch.clientX;
            let lastY = touch.clientY;
            let rubProgress = 0;

            const updateGhost = (x: number, y: number) => {
                ghost.style.left = `${x - ghost.offsetWidth / 2}px`;
                ghost.style.top = `${y - ghost.offsetHeight / 2}px`;
            };
            updateGhost(touch.clientX, touch.clientY);

            const moveHandler = (ev: TouchEvent) => {
                const t = ev.touches[0];
                updateGhost(t.clientX, t.clientY);

                // Check collision with otter
                const otterRect = otterContainer.getBoundingClientRect();
                const ghostRect = ghost.getBoundingClientRect();

                const overlap = !(ghostRect.right < otterRect.left ||
                    ghostRect.left > otterRect.right ||
                    ghostRect.bottom < otterRect.top ||
                    ghostRect.top > otterRect.bottom);

                if (overlap) {
                    const delta = Math.hypot(t.clientX - lastX, t.clientY - lastY);
                    if (delta > 5) {
                        rubProgress += delta;
                        if (rubProgress > 500) { // Threshold
                            getGameServiceInstance().bathe();
                            this.ctx.otterRenderer.triggerAnimation('bathe', getGameStateInstance().getEquipped(), () => { });
                            this.ctx.notificationUI.showAlert('Che bel bagnetto!', 'info');
                            rubProgress = 0;
                            void NativeService.haptics.vibrate();
                            void audioManager.playSFX('splash', true);
                        }
                    }
                }
                lastX = t.clientX;
                lastY = t.clientY;
            };

            const endHandler = () => {
                ghost.remove();
                document.removeEventListener('touchmove', moveHandler);
                document.removeEventListener('touchend', endHandler);
            };

            document.addEventListener('touchmove', moveHandler, { passive: false });
            document.addEventListener('touchend', endHandler);
        });
    }
}
