import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameState } from './GameState.js';
import { IStorageService } from './interfaces/IStorageService.js';
import { ICloudService, CloudRecoveryResult, SupabaseGameStateRow } from './interfaces/ICloudService.js';
import { IGameRulesService } from './interfaces/IGameRulesService.js';
import { CoreStats, PackedStats } from './types.js';

class FakeStorageService implements IStorageService {
    private store = new Map<string, string>();
    getItem(key: string): string | null {
        return this.store.has(key) ? this.store.get(key)! : null;
    }
    setItem(key: string, value: string): void {
        this.store.set(key, value);
    }
    removeItem(key: string): void {
        this.store.delete(key);
    }
}

class FakeCloudService implements ICloudService {
    public nextRemote: SupabaseGameStateRow | null = null;
    isAvailable(): boolean {
        return true;
    }
    async recoverFromCloudCode(): Promise<CloudRecoveryResult> {
        return { ok: false, reason: 'disabled' };
    }
    async syncWithSupabase(): Promise<SupabaseGameStateRow | null> {
        return this.nextRemote;
    }
}

class FakeGameRulesService implements IGameRulesService {
    public decayResult: CoreStats | null = null;
    public giftToGrant: string | undefined = undefined;

    calculateDecay(stats: CoreStats): CoreStats {
        return this.decayResult ?? { ...stats };
    }
    tryGrantGift(): string | undefined {
        return this.giftToGrant;
    }
    getDailyReward(day: number): { type: 'seaGlass' | 'item'; value: number | string } {
        return { type: 'seaGlass', value: day * 10 };
    }
    isMerchantAvailable(): boolean {
        return true;
    }
}

function makeGameState() {
    const storage = new FakeStorageService();
    const cloud = new FakeCloudService();
    const rules = new FakeGameRulesService();
    const gameState = new GameState(storage, cloud, rules);
    return { gameState, storage, cloud, rules };
}

describe('GameState.calculateOfflineProgress', () => {
    it('returns null and just refreshes lastLoginDate when elapsed time is below the offline threshold', () => {
        const { gameState } = makeGameState();
        const now = Date.now() + 30_000; // 30s, below the 60s minimum
        const result = gameState.calculateOfflineProgress(now);
        expect(result).toBeNull();
        expect(gameState.getLastLoginDate()).toBe(now);
    });

    it('applies decay via the rules service when elapsed time exceeds the threshold', () => {
        const { gameState, rules } = makeGameState();
        rules.decayResult = { hunger: 1, happiness: 2, energy: 3, clean: 4, seaGlass: 0 };
        const now = Date.now() + 2 * 60 * 60 * 1000; // 2 hours later
        const result = gameState.calculateOfflineProgress(now);
        expect(result).not.toBeNull();
        expect(result!.hoursAway).toBeCloseTo(2, 5);
        expect(result!.statsAfter.hunger).toBe(1);
        expect(gameState.getStats().hunger).toBe(1);
    });

    it('grants and records a gift when the rules service returns one', () => {
        const { gameState, rules } = makeGameState();
        rules.giftToGrant = 'Sasso Brillante';
        const now = Date.now() + 5 * 60 * 60 * 1000;
        const result = gameState.calculateOfflineProgress(now);
        expect(result!.gift).toBe('Sasso Brillante');
        expect(gameState.getInventory()).toContain('Sasso Brillante');
    });
});

describe('GameState daily bonus', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('continues the streak on the following day and halves it after a missed day', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-07-01T10:00:00'));
        const { gameState } = makeGameState();

        const day1 = gameState.claimDailyBonus();
        expect(day1).toEqual({ type: 'seaGlass', value: 10 });
        expect(gameState.getDailyStreak()).toBe(1);

        // Same day: cannot claim again
        expect(gameState.getDailyBonusStatus().canClaim).toBe(false);

        // Next day: streak continues
        vi.setSystemTime(new Date('2026-07-02T10:00:00'));
        const day2 = gameState.claimDailyBonus();
        expect(day2).toEqual({ type: 'seaGlass', value: 20 });
        expect(gameState.getDailyStreak()).toBe(2);

        // Skip a day: streak halves (floor) instead of wiping out to 1
        vi.setSystemTime(new Date('2026-07-04T10:00:00'));
        const day4 = gameState.claimDailyBonus();
        expect(day4).toEqual({ type: 'seaGlass', value: 10 });
        expect(gameState.getDailyStreak()).toBe(1);
    });

    it('does not wipe out a long streak entirely after a missed day', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-07-01T10:00:00'));
        const { gameState } = makeGameState();

        for (let day = 0; day < 6; day++) {
            vi.setSystemTime(new Date(2026, 6, 1 + day, 10, 0, 0));
            gameState.claimDailyBonus();
        }
        expect(gameState.getDailyStreak()).toBe(6);

        // Miss two days, then claim again: streak halves instead of resetting to 1
        vi.setSystemTime(new Date(2026, 6, 9, 10, 0, 0));
        gameState.claimDailyBonus();
        expect(gameState.getDailyStreak()).toBe(3);
    });
});

describe('GameState.addBondXP', () => {
    it('levels up once accumulated xp reaches level * 100', () => {
        const { gameState } = makeGameState();
        expect(gameState.getBond()).toEqual({ xp: 0, level: 1 });

        const leveledUpEarly = gameState.addBondXP(50);
        expect(leveledUpEarly).toBe(false);
        expect(gameState.getBond()).toEqual({ xp: 50, level: 1 });

        const leveledUp = gameState.addBondXP(60);
        expect(leveledUp).toBe(true);
        expect(gameState.getBond()).toEqual({ xp: 10, level: 2 });
    });
});

describe('GameState.syncWithSupabase merge behaviour', () => {
    let gameState: GameState;
    let cloud: FakeCloudService;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-07-01T10:00:00'));
        ({ gameState, cloud } = makeGameState());
        // Give the local state some bond/metrics/dailyLimits data to protect.
        gameState.addBondXP(30);
        gameState.incrementMetric('fishCaught', 5);
        gameState.incrementDailyUsage('stones', 2);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('does not overwrite local bond/metrics/dailyLimits when remote state is older', async () => {
        const staleRemoteStats: PackedStats = {
            hunger: 1, happiness: 1, energy: 1, clean: 1, seaGlass: 0,
            bond: { xp: 999, level: 99 },
            metrics: { gamesPlayed: 999, fishCaught: 999, itemsBought: 999 },
            dailyLimits: { date: 'stale', current: 999, firefly: 999, stones: 999 }
        };
        cloud.nextRemote = {
            id: 'p1',
            stats: staleRemoteStats,
            last_login: new Date('2026-06-01T00:00:00').toISOString(), // older than local
            inventory: [],
            updated_at: null,
            pet_name: null,
            created_at: null,
            player_name: null
        };

        await gameState.syncWithSupabase();

        expect(gameState.getBond()).toEqual({ xp: 30, level: 1 });
        expect(gameState.getMetrics().fishCaught).toBe(5);
        expect(gameState.getDailyUsage('stones')).toBe(2);
    });

    it('adopts remote bond/metrics/dailyLimits when remote state is newer', async () => {
        const freshRemoteStats: PackedStats = {
            hunger: 1, happiness: 1, energy: 1, clean: 1, seaGlass: 0,
            bond: { xp: 5, level: 3 },
            metrics: { gamesPlayed: 7, fishCaught: 42, itemsBought: 1 },
            dailyLimits: { date: new Date().toDateString(), current: 1, firefly: 1, stones: 9 }
        };
        cloud.nextRemote = {
            id: 'p1',
            stats: freshRemoteStats,
            last_login: new Date('2026-07-02T00:00:00').toISOString(), // newer than local
            inventory: [],
            updated_at: null,
            pet_name: null,
            created_at: null,
            player_name: null
        };

        await gameState.syncWithSupabase();

        expect(gameState.getBond()).toEqual({ xp: 5, level: 3 });
        expect(gameState.getMetrics().fishCaught).toBe(42);
        expect(gameState.getDailyUsage('stones')).toBe(9);
    });
});
