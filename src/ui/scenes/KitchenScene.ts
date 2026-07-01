import { audioManager } from '../../core/audio.js';
import { recordEvent } from '../../core/analytics.js';
import { getGameStateInstance, getGameServiceInstance } from '../../bootstrap.js';
import { handleTouchDrag } from '../utils/dragUtils.js';
import { SceneContext } from './SceneContext.js';

export class KitchenScene {
    constructor(private ctx: SceneContext) { }

    public init(): void {
        const foodItems = document.querySelectorAll<HTMLElement>('.draggable-item[data-food]');

        foodItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer?.setData('text/plain', item.dataset.food || '');
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });

            // Touch support for drag
            item.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleTouchDrag(item, e.touches[0], (elementUnder) => {
                    if (elementUnder && elementUnder.closest('.kitchen-otter')) {
                        this.feedWithSnack(item.dataset.food || null);
                    }
                });
            });
        });

        const dropZone = document.querySelector('.kitchen-otter');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault(); // Allow drop
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                const dragEvent = e as DragEvent;
                const foodKey = dragEvent.dataTransfer?.getData('text/plain');
                if (foodKey) {
                    this.feedWithSnack(foodKey);
                }
            });
        }
    }

    private feedWithSnack(snack: string | null): void {
        const { hunger } = getGameStateInstance().getStats();
        if (hunger >= 100) {
            this.ctx.notificationUI.showAlert('La lontra è piena!', 'warning');
            return;
        }

        getGameServiceInstance().feed();
        const equipped = getGameStateInstance().getEquipped();
        this.ctx.otterRenderer.triggerAnimation('feed', equipped, () => { });

        if (navigator.vibrate) navigator.vibrate(20);
        void audioManager.playSFX('feed', true); // Crunch sound

        if (snack) {
            recordEvent(`cibo:${snack}`);
        }
    }
}
