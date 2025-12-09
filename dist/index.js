import { UIManager } from './ui/UIManager.js';
import { calculateOfflineProgress, getGameStateInstance, getGameServiceInstance, syncWithSupabase } from './bootstrap.js';
import { audioManager } from './core/audio.js';
const uiManager = new UIManager();
function setupServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return;
    }
    const nav = navigator;
    if (nav.webdriver === true) {
        return;
    }
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) {
            return;
        }
        refreshing = true;
        window.location.reload();
    });
    navigator.serviceWorker.register('sw.js').then(registration => {
        registration.update().catch(() => {
            // ignora errori di rete temporanei
        });
        if (registration.waiting) {
            promptForUpdate(registration.waiting);
        }
        registration.addEventListener('updatefound', () => {
            const installer = registration.installing;
            if (!installer) {
                return;
            }
            installer.addEventListener('statechange', () => {
                if (installer.state === 'installed' && navigator.serviceWorker.controller) {
                    promptForUpdate(installer);
                }
            });
        });
        window.setInterval(() => {
            registration.update().catch(() => undefined);
        }, 60 * 60 * 1000);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                registration.update().catch(() => undefined);
            }
        });
    }).catch(error => {
        console.warn('Impossibile registrare il Service Worker', error);
    });
}
function promptForUpdate(worker) {
    uiManager.prepareUpdatePrompt(() => {
        worker.postMessage({ type: 'SKIP_WAITING' });
    }, () => {
        // Nessuna azione aggiuntiva per ora
    });
}
function bootstrap() {
    // ensurePersistentStorage(); // Was in state.ts. LocalStorageService handles this implicitly or we can add it.
    // For now, assume browser handles it or add explicit check if needed.
    const gameState = getGameStateInstance();
    window.addEventListener('pebble-gift-found', event => {
        const customEvent = event;
        const item = customEvent.detail?.item ?? 'dono misterioso';
        uiManager.showGiftModal(item);
    });
    const offlineProgress = calculateOfflineProgress();
    if (offlineProgress) {
        const hoursText = offlineProgress.hoursAway.toFixed(2);
        console.info(`[Pebble] Sei stato via per ${hoursText} ore.`);
        if (offlineProgress.gift) {
            uiManager.showGiftModal(offlineProgress.gift);
        }
    }
    // Expose for debugging
    window.gameService = getGameServiceInstance();
    window.gameState = gameState;
    void syncWithSupabase();
    // Diagnostic: log resolved config values to help debug cloud sync setup
    void import('./core/config.js').then(cfg => {
        try {
            const supabaseUrl = typeof cfg.getSupabaseUrl === 'function' ? cfg.getSupabaseUrl() : '';
            const anon = typeof cfg.getSupabaseAnonKey === 'function' ? cfg.getSupabaseAnonKey() : '';
            const anonPreview = anon ? `${anon.slice(0, 6)}…${anon.slice(-6)}` : '(vuota)';
            console.info('[Pebble] runtime config:', { supabaseUrl: supabaseUrl || '(vuota)', supabaseAnonKey: anonPreview });
        }
        catch (err) {
            console.info('[Pebble] runtime config: unable to read config module', err);
        }
    }).catch(err => {
        console.info('[Pebble] runtime config: import error', err);
    });
    uiManager.init();
    setupServiceWorker();
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            audioManager.suspend();
        }
        else {
            void audioManager.resume();
        }
    });
    window.addEventListener('pagehide', () => {
        audioManager.suspend();
    });
    // Game Loop / Tick
    window.setInterval(() => {
        // advanceTick(); // Was in state.ts. Logic needs to be moved to GameService or GameState.
        // GameState.calculateOfflineProgress handles decay.
        // We need a 'tick' method for active play decay?
        // state.ts had 'advanceTick' which decayed stats every 5 seconds.
        // Let's implement decay in GameService or GameState.
        // For now, let's just use calculateOfflineProgress with current time?
        // No, offline progress is for large gaps.
        // We need a simple decay.
        const stats = gameState.getStats();
        gameState.setStats({
            hunger: Math.max(0, stats.hunger - 0.5),
            happiness: Math.max(0, stats.happiness - 0.5),
            energy: Math.max(0, stats.energy - 0.2),
            clean: Math.max(0, stats.clean - 0.3)
        });
    }, 5000);
    // Auto-save is handled by GameState on every change, but we can force sync occasionally?
    // GameState writes to storage on every setStats.
    // We might want to sync with cloud periodically.
    window.setInterval(() => void syncWithSupabase(), 60000);
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        bootstrap();
    });
}
else {
    bootstrap();
}
