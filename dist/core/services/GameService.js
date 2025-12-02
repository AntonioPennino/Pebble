import { recordEvent } from '../analytics.js';
import { audioManager } from '../audio.js';
export class GameService {
    constructor(gameState) {
        this.gameState = gameState;
    }
    feed() {
        const stats = this.gameState.getStats();
        if (stats.hunger >= 100) {
            return; // Already full
        }
        this.gameState.setStats({
            hunger: Math.min(100, stats.hunger + 20),
            happiness: Math.min(100, stats.happiness + 6),
            coins: Math.max(0, stats.coins - 5)
        });
        recordEvent('azione:cibo');
        void audioManager.playSFX('eat');
    }
    bathe() {
        const stats = this.gameState.getStats();
        this.gameState.setStats({
            clean: Math.min(100, stats.clean + 25),
            happiness: Math.min(100, stats.happiness + 4)
        });
        recordEvent('azione:bagno');
    }
    sleep() {
        const stats = this.gameState.getStats();
        this.gameState.setStats({
            energy: Math.min(100, stats.energy + 40),
            happiness: Math.min(100, stats.happiness + 3)
        });
        recordEvent('azione:sonno');
    }
    spendCoins(amount) {
        const stats = this.gameState.getStats();
        if (stats.coins >= amount) {
            this.gameState.setStats({
                coins: stats.coins - amount
            });
            recordEvent(`spesa:${amount}`);
            return true;
        }
        return false;
    }
    rewardMiniGameStart() {
        this.gameState.incrementMetric('gamesPlayed');
        recordEvent('minigioco:avviato');
    }
    rewardFishCatch() {
        const stats = this.gameState.getStats();
        this.gameState.setStats({
            coins: stats.coins + 2,
            happiness: Math.min(100, stats.happiness + 4)
        });
        this.gameState.incrementMetric('fishCaught');
        recordEvent('minigioco:pesce');
    }
    rewardItemPurchase(itemKey) {
        this.gameState.incrementMetric('itemsBought');
        recordEvent(`acquisto:${itemKey}`);
    }
}
