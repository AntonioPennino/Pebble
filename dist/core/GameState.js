const LOCAL_STORAGE_KEY = 'pebble:game-state:v1';
const PLAYER_ID_STORAGE_KEY = 'pebble:player-id:v1';
const MIN_ELAPSED_FOR_OFFLINE_MS = 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;
const DEFAULT_STATS = {
    hunger: 80,
    happiness: 85,
    energy: 75,
    clean: 80,
    coins: 0
};
export class GameState {
    constructor(storageService, cloudService, gameRulesService) {
        this.storageService = storageService;
        this.cloudService = cloudService;
        this.gameRulesService = gameRulesService;
        this.hadStoredStateOnBoot = false;
        this.hadStoredPlayerId = false;
        this.attemptedRemoteRecovery = false;
        this.listeners = [];
        const stored = this.readFromStorage();
        this.hadStoredStateOnBoot = stored.hadData;
        this.stats = stored.state.stats;
        this.lastLoginDate = stored.state.lastLoginDate;
        this.inventory = stored.state.inventory;
        this.petName = stored.state.petName;
        this.equipped = stored.state.equipped;
        this.metrics = stored.state.metrics;
        this.playerId = this.resolvePlayerId();
        this.dispatchPlayerIdChange();
    }
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    notifyListeners() {
        this.listeners.forEach(l => l());
    }
    getStats() {
        return this.cloneStats(this.stats);
    }
    getInventory() {
        return [...this.inventory];
    }
    getPetName() {
        return this.petName;
    }
    getEquipped() {
        return { ...this.equipped };
    }
    getMetrics() {
        return { ...this.metrics };
    }
    incrementMetric(metric, amount = 1) {
        this.metrics[metric] += amount;
        this.writeToStorage();
        this.notifyListeners();
    }
    getPlayerId() {
        return this.playerId;
    }
    async recoverFromCloudCode(code) {
        const result = await this.cloudService.recoverFromCloudCode(code, this.playerId);
        if (result.ok) {
            await this.syncWithSupabase();
            return { ok: true, alreadyLinked: result.alreadyLinked };
        }
        return { ok: false, reason: result.reason };
    }
    setInventory(items) {
        const sanitized = this.sanitizeInventory(items);
        const changed = sanitized.length !== this.inventory.length
            || sanitized.some((item, index) => item !== this.inventory[index]);
        if (!changed) {
            return;
        }
        this.inventory = sanitized;
        this.writeToStorage();
        this.notifyInventoryChange();
        this.notifyListeners();
    }
    setPetName(name) {
        const sanitized = name.trim().slice(0, 24);
        if (sanitized !== this.petName) {
            this.petName = sanitized || 'Pebble';
            this.writeToStorage();
            this.notifyListeners();
        }
    }
    setEquipped(equipped) {
        this.equipped = { ...this.equipped, ...equipped };
        this.writeToStorage();
        this.notifyListeners();
    }
    getLastLoginDate() {
        return this.lastLoginDate;
    }
    setStats(partial) {
        this.stats = this.mergeStats(this.stats, partial);
        this.writeToStorage();
        this.notifyListeners();
    }
    calculateOfflineProgress(now = Date.now()) {
        const previousLogin = this.lastLoginDate;
        if (!Number.isFinite(previousLogin) || previousLogin <= 0) {
            this.lastLoginDate = now;
            this.writeToStorage();
            return null;
        }
        const elapsedMs = now - previousLogin;
        if (elapsedMs < MIN_ELAPSED_FOR_OFFLINE_MS) {
            this.lastLoginDate = now;
            this.writeToStorage();
            return null;
        }
        const hoursAway = elapsedMs / MS_PER_HOUR;
        const statsBefore = this.cloneStats(this.stats);
        this.stats = this.gameRulesService.calculateDecay(this.stats, hoursAway);
        const gift = this.gameRulesService.tryGrantGift(hoursAway, this.inventory);
        if (gift) {
            this.inventory.push(gift);
            this.dispatchGiftEvent(gift);
            this.notifyInventoryChange();
        }
        this.lastLoginDate = now;
        this.writeToStorage();
        this.notifyListeners();
        return {
            hoursAway,
            statsBefore,
            statsAfter: this.cloneStats(this.stats),
            gift
        };
    }
    async syncWithSupabase() {
        // Note: We currently only sync stats and inventory. PetName and Equipped are local-only for now,
        // or we need to update the Supabase schema. For now, let's keep them local or assume they are part of 'stats' if we change the schema.
        // The current SupabaseCloudService expects CoreStats.
        // TODO: Update Supabase schema to include petName and equipped if needed.
        const remote = await this.cloudService.syncWithSupabase(this.playerId, this.stats, this.lastLoginDate, this.inventory);
        if (remote) {
            this.mergeRemoteState(remote);
            this.writeToStorage();
            this.notifyListeners();
        }
    }
    mergeRemoteState(remote) {
        const remoteLogin = typeof remote.last_login === 'string' ? Date.parse(remote.last_login) : Number.NaN;
        const remoteStats = this.sanitizeStats(remote.stats);
        const remoteInventory = this.sanitizeInventory(remote.inventory);
        if (Number.isFinite(remoteLogin) && remoteLogin > this.lastLoginDate) {
            this.stats = remoteStats;
            this.lastLoginDate = remoteLogin;
        }
        const mergedInventory = new Set([...this.inventory, ...remoteInventory]);
        const beforeSize = this.inventory.length;
        this.inventory = Array.from(mergedInventory);
        if (this.inventory.length !== beforeSize) {
            this.notifyInventoryChange();
        }
    }
    dispatchGiftEvent(item) {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            const event = new CustomEvent('pebble-gift-found', {
                detail: { item }
            });
            window.dispatchEvent(event);
        }
    }
    mergeStats(current, partial) {
        return {
            hunger: this.clampStat(partial.hunger ?? current.hunger),
            happiness: this.clampStat(partial.happiness ?? current.happiness),
            energy: this.clampStat(partial.energy ?? current.energy),
            clean: this.clampStat(partial.clean ?? current.clean),
            coins: Math.max(0, partial.coins ?? current.coins)
        };
    }
    sanitizeStats(candidate) {
        if (!candidate) {
            return this.cloneStats(DEFAULT_STATS);
        }
        return {
            hunger: this.clampStat(typeof candidate.hunger === 'number' ? candidate.hunger : DEFAULT_STATS.hunger),
            happiness: this.clampStat(typeof candidate.happiness === 'number' ? candidate.happiness : DEFAULT_STATS.happiness),
            energy: this.clampStat(typeof candidate.energy === 'number' ? candidate.energy : DEFAULT_STATS.energy),
            clean: this.clampStat(typeof candidate.clean === 'number' ? candidate.clean : DEFAULT_STATS.clean),
            coins: Math.max(0, typeof candidate.coins === 'number' ? candidate.coins : DEFAULT_STATS.coins)
        };
    }
    sanitizeInventory(candidate) {
        if (!Array.isArray(candidate)) {
            return [];
        }
        return candidate
            .map(item => (typeof item === 'string' ? item : String(item)))
            .map(item => item.trim())
            .filter(item => item.length > 0);
    }
    applyRecoveredSupabaseState(newPlayerId, remote) {
        this.applyPlayerId(newPlayerId, { forceNotify: true });
        const remoteStats = this.sanitizeStats(remote.stats);
        const remoteLogin = typeof remote.last_login === 'string' ? Date.parse(remote.last_login) : Number.NaN;
        const remoteInventory = this.sanitizeInventory(remote.inventory);
        this.stats = remoteStats;
        this.lastLoginDate = Number.isFinite(remoteLogin) ? remoteLogin : Date.now();
        this.inventory = remoteInventory;
        this.writeToStorage();
        this.notifyInventoryChange();
        this.notifyListeners();
    }
    applyPlayerId(newId, options = {}) {
        const sanitized = newId.trim();
        if (!sanitized) {
            return;
        }
        const changed = sanitized !== this.playerId;
        this.playerId = sanitized;
        this.hadStoredPlayerId = true;
        this.persistPlayerId(sanitized);
        if (changed || options.forceNotify) {
            this.dispatchPlayerIdChange();
        }
    }
    dispatchPlayerIdChange() {
        if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
            return;
        }
        const event = new CustomEvent('pebble-player-id-changed', {
            detail: { playerId: this.playerId }
        });
        window.dispatchEvent(event);
    }
    notifyInventoryChange() {
        if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
            return;
        }
        const event = new CustomEvent('pebble-inventory-changed', {
            detail: { inventory: this.getInventory() }
        });
        window.dispatchEvent(event);
    }
    readFromStorage() {
        const raw = this.storageService.getItem(LOCAL_STORAGE_KEY);
        if (!raw) {
            return { state: this.createDefaultState(), hadData: false };
        }
        try {
            const parsed = JSON.parse(raw);
            const stats = this.sanitizeStats(parsed.stats);
            const lastLoginDate = typeof parsed.lastLoginDate === 'number' && Number.isFinite(parsed.lastLoginDate)
                ? parsed.lastLoginDate
                : Date.now();
            const inventory = this.sanitizeInventory(parsed.inventory);
            const petName = typeof parsed.petName === 'string' ? parsed.petName : 'Pebble';
            const equipped = parsed.equipped || { hat: false, scarf: false, sunglasses: false };
            const metrics = parsed.metrics || { gamesPlayed: 0, fishCaught: 0, itemsBought: 0 };
            return { state: { stats, lastLoginDate, inventory, petName, equipped, metrics }, hadData: true };
        }
        catch (error) {
            console.warn('Impossibile leggere il GameState locale, verrà ricreato', error);
            return { state: this.createDefaultState(), hadData: false };
        }
    }
    writeToStorage() {
        const payload = {
            stats: this.cloneStats(this.stats),
            lastLoginDate: this.lastLoginDate,
            inventory: [...this.inventory],
            petName: this.petName,
            equipped: { ...this.equipped },
            metrics: { ...this.metrics }
        };
        this.storageService.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
        this.persistPlayerId(this.playerId);
    }
    resolvePlayerId() {
        const existing = this.storageService.getItem(PLAYER_ID_STORAGE_KEY);
        if (existing && existing.trim().length > 0) {
            this.hadStoredPlayerId = true;
            return existing;
        }
        const generated = this.generatePlayerId();
        this.hadStoredPlayerId = false;
        this.persistPlayerId(generated);
        return generated;
    }
    persistPlayerId(id) {
        this.storageService.setItem(PLAYER_ID_STORAGE_KEY, id);
    }
    createDefaultState() {
        return {
            stats: this.cloneStats(DEFAULT_STATS),
            lastLoginDate: Date.now(),
            inventory: [],
            petName: 'Pebble',
            equipped: { hat: false, scarf: false, sunglasses: false },
            metrics: { gamesPlayed: 0, fishCaught: 0, itemsBought: 0 }
        };
    }
    cloneStats(stats) {
        return { ...stats };
    }
    clampStat(value) {
        if (!Number.isFinite(value))
            return 0;
        if (value < 0)
            return 0;
        if (value > 100)
            return 100;
        return Math.round(value * 10) / 10;
    }
    generatePlayerId() {
        if (typeof crypto !== 'undefined') {
            if (typeof crypto.randomUUID === 'function') {
                return crypto.randomUUID();
            }
            if (typeof crypto.getRandomValues === 'function') {
                const buffer = new Uint8Array(16);
                crypto.getRandomValues(buffer);
                return Array.from(buffer).map(byte => byte.toString(16).padStart(2, '0')).join('');
            }
        }
        const random = Math.floor(Math.random() * 4294967295).toString(16).padStart(8, '0');
        return `player-${Date.now().toString(16)}-${random}`;
    }
}
