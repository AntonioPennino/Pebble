import { GameState } from './core/GameState.js';
import { SettingsState } from './core/SettingsState.js';
import { GameService } from './core/services/GameService.js';
import { LocalStorageService } from './core/services/LocalStorageService.js';
import { SupabaseCloudService } from './core/services/SupabaseCloudService.js';
import { StandardGameRulesService } from './core/services/StandardGameRulesService.js';
let gameStateInstance = null;
let settingsStateInstance = null;
let gameServiceInstance = null;
export function initializeGame() {
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
export function getGameStateInstance() {
    if (!gameStateInstance) {
        initializeGame();
    }
    return gameStateInstance;
}
export function getSettingsStateInstance() {
    if (!settingsStateInstance) {
        initializeGame();
    }
    return settingsStateInstance;
}
export function getGameServiceInstance() {
    if (!gameServiceInstance) {
        initializeGame();
    }
    return gameServiceInstance;
}
export function calculateOfflineProgress(now) {
    return getGameStateInstance().calculateOfflineProgress(now);
}
export async function syncWithSupabase() {
    await getGameStateInstance().syncWithSupabase();
}
// Legacy sync removed as we are removing state.ts
export { GameState, SettingsState, GameService };
