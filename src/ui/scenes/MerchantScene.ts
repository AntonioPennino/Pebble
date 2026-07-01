import { $ } from '../utils.js';
import { getGameStateInstance, getGameServiceInstance } from '../../bootstrap.js';
import { StandardGameRulesService } from '../../core/services/StandardGameRulesService.js';
import { SceneContext } from './SceneContext.js';

export class MerchantScene {
    constructor(private ctx: SceneContext) { }

    public init(): void {
        const shopTrigger = $('shopTrigger');
        const shopOverlay = $('shopOverlay');
        const closeShopBtn = $('closeShopBtn');
        const shopItems = document.querySelectorAll('.shop-item');
        const seaGlassDisplay = $('seaGlassCount');
        const merchantChar = document.querySelector('.merchant-character') as HTMLElement;

        // Check Merchant Schedule (Soul)
        const rules = new StandardGameRulesService();
        const isAvailable = rules.isMerchantAvailable();
        const todayKey = new Date().toDateString();
        const notifiedKey = `pebble_merchant_notified_${todayKey}`;

        if (!isAvailable) {
            // Merchant is away
            if (merchantChar) merchantChar.style.display = 'none';
            if (shopTrigger) {
                shopTrigger.style.opacity = '0.5'; // Dim the rug/trigger
                shopTrigger.style.pointerEvents = 'none'; // Disable click
            }
            // If shop is open? (Shouldn't happen on reload, but if open, close it?)
            if (shopOverlay && !shopOverlay.classList.contains('hidden')) {
                shopOverlay.classList.add('hidden');
            }
        } else {
            // Merchant is here
            if (merchantChar) merchantChar.style.display = 'block';
            if (shopTrigger) {
                shopTrigger.style.opacity = '1';
                shopTrigger.style.pointerEvents = 'auto';
            }

            // Notify if fresh arrival
            const alreadyNotified = localStorage.getItem(notifiedKey);
            if (!alreadyNotified) {
                setTimeout(() => {
                    this.ctx.notificationUI.showAlert('Il mercante è stato avvistato!', 'info');
                    if (navigator.vibrate) navigator.vibrate([50, 50]);
                }, 2000); // Delay slightly for immersion
                localStorage.setItem(notifiedKey, 'true');
            }
        }

        const updateDisplay = () => {
            if (seaGlassDisplay) {
                seaGlassDisplay.textContent = String(getGameStateInstance().getStats().seaGlass);
            }
        };

        // Initial update
        updateDisplay();
        getGameStateInstance().subscribe(updateDisplay);

        // Open Shop
        shopTrigger?.addEventListener('click', () => {
            shopOverlay?.classList.remove('hidden');
        });

        // Close Shop
        closeShopBtn?.addEventListener('click', () => {
            shopOverlay?.classList.add('hidden');
        });

        // Purchase Logic
        const inventory = getGameStateInstance().getInventory(); // Update inventory reference

        shopItems.forEach(item => {
            const itemKey = (item as HTMLElement).dataset.item;

            // Check if already owned
            if (itemKey && inventory.includes(itemKey)) {
                item.classList.add('purchased');
                (item as HTMLElement).style.opacity = '0.5';
                (item as HTMLElement).style.pointerEvents = 'none';
            }

            item.addEventListener('click', () => {
                const cost = Number((item as HTMLElement).dataset.cost);
                const currentItemKey = (item as HTMLElement).dataset.item; // distinct var

                if (!cost || !currentItemKey) return;

                if (getGameServiceInstance().spendCoins(cost)) {
                    getGameServiceInstance().rewardItemPurchase(currentItemKey);
                    this.ctx.notificationUI.showAlert(`Hai ottenuto: ${currentItemKey}!`, 'info');

                    // Visual feedback
                    item.classList.add('purchased');
                    (item as HTMLElement).style.opacity = '0.5';
                    (item as HTMLElement).style.pointerEvents = 'none'; // Disable further clicks
                } else {
                    this.ctx.notificationUI.showAlert('Non hai abbastanza Vetri di Mare.', 'warning');
                }
            });
        });
    }
}
