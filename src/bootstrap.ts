import { GameState } from './core/GameState.js';
import { SettingsState } from './core/SettingsState.js';
import { GameService } from './core/services/GameService.js';
import { LocalStorageService } from './core/services/LocalStorageService.js';
import { SupabaseCloudService } from './core/services/SupabaseCloudService.js';
import { StandardGameRulesService } from './core/services/StandardGameRulesService.js';
import { OfflineProgressResult } from './core/interfaces/IGameRulesService.js';

let gameStateInstance: GameState | null = null;
let settingsStateInstance: SettingsState | null = null;
let gameServiceInstance: GameService | null = null;

export function initializeGame(): { gameState: GameState; settingsState: SettingsState; gameService: GameService } {
    if (gameStateInstance && settingsStateInstance && gameServiceInstance) {
        return { gameState: gameStateInstance, settingsState: settingsStateInstance, gameService: gameServiceInstance };
    }

    const storageService = new LocalStorageService();
    const cloudService = new SupabaseCloudService();
    const gameRulesService = new StandardGameRulesService();

    gameStateInstance = new GameState(storageService, cloudService, gameRulesService);
    settingsStateInstance = new SettingsState(storageService);
    gameServiceInstance = new GameService(gameStateInstance);

    return { gameState: gameStateInstance, settingsState: settingsStateInstance, gameService: gameServiceInstance };
}

export function getGameStateInstance(): GameState {
    if (!gameStateInstance) {
        initializeGame();
    }
    return gameStateInstance!;
}

export function getSettingsStateInstance(): SettingsState {
    if (!settingsStateInstance) {
        initializeGame();
    }
    return settingsStateInstance!;
}

export function getGameServiceInstance(): GameService {
    if (!gameServiceInstance) {
        initializeGame();
    }
    return gameServiceInstance!;
}

export function calculateOfflineProgress(now?: number): OfflineProgressResult | null {
    return getGameStateInstance().calculateOfflineProgress(now);
}

export async function syncWithSupabase(): Promise<void> {
    await getGameStateInstance().syncWithSupabase();
}

// Legacy sync removed as we are removing state.ts
export { GameState, SettingsState, GameService };
