import { GameState } from '../GameState.js';
import { recordEvent } from '../analytics.js';
import { audioManager } from '../audio.js';

export class GameService {
    constructor(private gameState: GameState) { }

    public feed(): void {
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

    public bathe(): void {
        const stats = this.gameState.getStats();
        this.gameState.setStats({
            clean: Math.min(100, stats.clean + 25),
            happiness: Math.min(100, stats.happiness + 4)
        });
        recordEvent('azione:bagno');
    }

    public sleep(): void {
        const stats = this.gameState.getStats();
        this.gameState.setStats({
            energy: Math.min(100, stats.energy + 40),
            happiness: Math.min(100, stats.happiness + 3)
        });
        recordEvent('azione:sonno');
    }

    public spendCoins(amount: number): boolean {
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

    public rewardMiniGameStart(): void {
        this.gameState.incrementMetric('gamesPlayed');
        recordEvent('minigioco:avviato');
    }

    public rewardFishCatch(): void {
        const stats = this.gameState.getStats();
        this.gameState.setStats({
            coins: stats.coins + 2,
            happiness: Math.min(100, stats.happiness + 4)
        });
        this.gameState.incrementMetric('fishCaught');
        recordEvent('minigioco:pesce');
    }

    public rewardItemPurchase(itemKey: string): void {
        this.gameState.incrementMetric('itemsBought');
        recordEvent(`acquisto:${itemKey}`);
    }
}
