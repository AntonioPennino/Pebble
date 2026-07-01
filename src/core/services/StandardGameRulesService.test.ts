import { describe, it, expect, vi, afterEach } from 'vitest';
import { StandardGameRulesService } from './StandardGameRulesService.js';
import { CoreStats } from '../types.js';

const baseStats: CoreStats = { hunger: 80, happiness: 85, energy: 75, clean: 80, seaGlass: 10 };

describe('StandardGameRulesService.calculateDecay', () => {
    const service = new StandardGameRulesService();

    it('returns an unchanged copy when hoursAway is 0 or negative', () => {
        expect(service.calculateDecay(baseStats, 0)).toEqual(baseStats);
        expect(service.calculateDecay(baseStats, -5)).toEqual(baseStats);
    });

    it('decays stats proportionally to hours away', () => {
        const result = service.calculateDecay(baseStats, 2);
        expect(result.hunger).toBeCloseTo(80 - 1.5 * 2, 5);
        expect(result.happiness).toBeCloseTo(85 - 0.9 * 2, 5);
        expect(result.energy).toBeCloseTo(75 - 1.2 * 2, 5);
        expect(result.clean).toBeCloseTo(80 - 0.8 * 2, 5);
    });

    it('never decays seaGlass', () => {
        const result = service.calculateDecay(baseStats, 100);
        expect(result.seaGlass).toBe(10);
    });

    it('clamps decayed stats to a minimum of 0', () => {
        const result = service.calculateDecay(baseStats, 1000);
        expect(result.hunger).toBe(0);
        expect(result.happiness).toBe(0);
        expect(result.energy).toBe(0);
        expect(result.clean).toBe(0);
    });
});

describe('StandardGameRulesService.tryGrantGift', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('never grants a gift before the minimum hours threshold', () => {
        const service = new StandardGameRulesService();
        vi.spyOn(Math, 'random').mockReturnValue(0); // would grant if threshold allowed it
        expect(service.tryGrantGift(3.99, [])).toBeUndefined();
    });

    it('grants a gift past the threshold when the roll succeeds', () => {
        const service = new StandardGameRulesService();
        vi.spyOn(Math, 'random').mockReturnValue(0);
        expect(service.tryGrantGift(4, [])).toBeDefined();
    });

    it('does not grant a gift past the threshold when the roll fails', () => {
        const service = new StandardGameRulesService();
        vi.spyOn(Math, 'random').mockReturnValue(0.99);
        expect(service.tryGrantGift(10, [])).toBeUndefined();
    });
});

describe('StandardGameRulesService.getDailyReward', () => {
    const service = new StandardGameRulesService();

    it('cycles rewards every 7 days', () => {
        expect(service.getDailyReward(1)).toEqual(service.getDailyReward(8));
        expect(service.getDailyReward(7)).toEqual(service.getDailyReward(14));
    });

    it('gives the jackpot on day 7 of the cycle', () => {
        expect(service.getDailyReward(7)).toEqual({ type: 'seaGlass', value: 300 });
    });
});

describe('StandardGameRulesService.isMerchantAvailable', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('is available on Wednesday at noon', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-07-01T12:00:00')); // Wednesday
        const service = new StandardGameRulesService();
        expect(service.isMerchantAvailable()).toBe(true);
    });

    it('is not available on Tuesday', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-30T12:00:00')); // Tuesday
        const service = new StandardGameRulesService();
        expect(service.isMerchantAvailable()).toBe(false);
    });

    it('is not available outside the 08:00-20:00 window', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-07-01T21:00:00')); // Wednesday night
        const service = new StandardGameRulesService();
        expect(service.isMerchantAvailable()).toBe(false);
    });
});
