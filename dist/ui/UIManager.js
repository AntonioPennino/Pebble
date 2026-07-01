import { $ } from './utils.js';
import { applyTheme } from './theme.js';
import { HUD } from './components/HUD.js';
import { InventoryView } from './components/InventoryView.js';
import { OtterRenderer } from './components/OtterRenderer.js';
import { ModalManager } from './components/ModalManager.js';
import { NotificationUI } from './components/NotificationUI.js';
import { initMiniGame, isMiniGameRunning } from '../features/minigame.js';
import { audioManager, resumeAudioContext } from '../core/audio.js';
import { recordEvent } from '../core/analytics.js';
import { getGameStateInstance, getSettingsStateInstance } from '../bootstrap.js';
import { enableNotifications, disableNotifications } from '../core/services/notifications.js';
import { DenScene } from './scenes/DenScene.js';
import { KitchenScene } from './scenes/KitchenScene.js';
import { HygieneScene } from './scenes/HygieneScene.js';
import { GamesScene } from './scenes/GamesScene.js';
import { MerchantScene } from './scenes/MerchantScene.js';
import { JournalScene } from './scenes/JournalScene.js';
export class UIManager {
    constructor() {
        this.updateConfirm = null;
        this.updateDismiss = null;
        this.hud = new HUD();
        this.inventoryView = new InventoryView();
        this.otterRenderer = new OtterRenderer();
        this.modalManager = new ModalManager(this.inventoryView);
        this.notificationUI = new NotificationUI();
        const sceneContext = {
            notificationUI: this.notificationUI,
            otterRenderer: this.otterRenderer,
            triggerUpdate: () => this.updateConfirm?.()
        };
        this.denScene = new DenScene(sceneContext);
        this.kitchenScene = new KitchenScene(sceneContext);
        this.hygieneScene = new HygieneScene(sceneContext);
        this.gamesScene = new GamesScene(sceneContext);
        this.merchantScene = new MerchantScene(sceneContext);
        this.journalScene = new JournalScene(sceneContext);
    }
    init() {
        this.initScrollObserver(); // New scroll-based navigation
        this.initBlink();
        this.initAnalyticsToggle();
        this.initNotificationControls();
        this.initCloudSyncControls();
        this.initInstallPrompt();
        this.initNamePrompt();
        this.initTutorial();
        this.initUpdateBanner();
        this.denScene.init();
        this.kitchenScene.init();
        this.hygieneScene.init();
        this.gamesScene.init();
        this.merchantScene.init();
        this.journalScene.init();
        // Listen for inventory changes from GameState
        window.addEventListener('pebble-inventory-changed', event => {
            const detail = event.detail;
            if (detail) {
                this.inventoryView.render(detail.inventory);
            }
        });
        // MiniGame initialization
        const overlayEl = $('overlay');
        const areaEl = $('fishArea');
        const scoreEl = $('miniScore');
        const closeButtonEl = $('closeMini');
        if (overlayEl && areaEl && scoreEl && closeButtonEl) {
            initMiniGame({
                overlay: overlayEl,
                area: areaEl,
                score: scoreEl,
                closeButton: closeButtonEl
            }, {
                onFinish: result => {
                    this.notificationUI.showAlert(`Mini-gioco terminato! Hai catturato ${result} pesci.`, 'info');
                }
            });
        }
        // Initial render subscription
        const gameState = getGameStateInstance();
        const settingsState = getSettingsStateInstance();
        gameState.subscribe(() => this.render());
        settingsState.subscribe(() => this.render());
        this.render();
        // Resume audio context on first click
        document.addEventListener('click', () => {
            void resumeAudioContext();
            // Zen Mode stays strict until toggled off in journal; tapping the screen
            // while in Zen Mode briefly shows the UI.
            if (document.body.classList.contains('zen-mode')) {
                this.tempShowUI();
            }
        }, { capture: true }); // Capture to handle before other clicks if needed
    }
    prepareUpdatePrompt(onConfirm, onDismiss) {
        this.updateConfirm = onConfirm;
        this.updateDismiss = onDismiss;
        const banner = $('updateBanner');
        if (!banner)
            return;
        banner.classList.remove('hidden');
        this.notificationUI.showAlert('Nuova versione disponibile! Premi Aggiorna per ricaricare.', 'info');
    }
    showGiftModal(item) {
        const gameState = getGameStateInstance();
        this.modalManager.showGiftModal(item, gameState.getInventory());
    }
    render() {
        const gameState = getGameStateInstance();
        const settingsState = getSettingsStateInstance();
        const coreStats = gameState.getStats();
        const equipped = gameState.getEquipped();
        const settings = settingsState.getSettings();
        const pseudoState = {
            ...coreStats,
            ...equipped,
            petName: gameState.getPetName(),
            petNameConfirmed: !!gameState.getPetName(),
            theme: settings.theme,
            notifications: settings.notifications,
            tutorialSeen: settings.tutorialSeen,
            installPromptDismissed: settings.installPromptDismissed,
            analyticsOptIn: settings.analyticsOptIn,
            analytics: settings.analytics,
            stats: gameState.getMetrics()
        };
        this.hud.update(pseudoState, coreStats);
        this.modalManager.updateOverlays(pseudoState);
        this.notificationUI.refresh(pseudoState);
        // Sync otter appearance
        let mood = 'neutral';
        if (gameState.getIsSleeping()) {
            mood = 'sleepy'; // Force sleepy if sleeping
        }
        else if (coreStats.happiness > 80 && coreStats.hunger > 80 && coreStats.energy > 80) {
            mood = 'happy';
        }
        else if (coreStats.happiness < 30 || coreStats.hunger < 30) {
            mood = 'sad';
        }
        else if (coreStats.energy < 30) {
            mood = 'sleepy';
        }
        this.otterRenderer.sync(mood, equipped);
        this.inventoryView.render(gameState.getInventory());
        // Apply theme
        applyTheme(settings.theme);
    }
    // --- Initialization Methods ---
    initScrollObserver() {
        const container = document.getElementById('worldContainer');
        const scenes = document.querySelectorAll('.scene');
        if (!container)
            return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    const sceneId = entry.target.getAttribute('data-scene');
                    if (sceneId) {
                        this.handleSceneChange(sceneId);
                    }
                }
            });
        }, {
            root: container,
            threshold: 0.6
        });
        scenes.forEach(scene => observer.observe(scene));
    }
    handleSceneChange(sceneId) {
        recordEvent(`nav:${sceneId}`);
        // Ambient Audio Logic
        const ambientByScene = {
            den: { track: 'ambient-fireplace', volume: 0.38 },
            kitchen: { track: 'ambient-river', volume: 0.55 },
            hygiene: { track: 'ambient-river', volume: 0.6 },
            games: { track: 'ambient-birds', volume: 0.45 },
            shop: { track: 'ambient-fireplace', volume: 0.35 }
        };
        const ambientTarget = ambientByScene[sceneId];
        if (ambientTarget && audioManager.hasAsset(ambientTarget.track)) {
            void audioManager.playAmbient(ambientTarget.track, ambientTarget.volume);
        }
        else {
            void audioManager.stopAmbient();
        }
    }
    initBlink() {
        window.setInterval(() => {
            const img = $('otterImage');
            if (!img || isMiniGameRunning()) {
                return;
            }
            img.classList.add('blink');
            window.setTimeout(() => img.classList.remove('blink'), 180);
        }, 4000 + Math.random() * 2000);
    }
    initAnalyticsToggle() {
        const toggle = $('analyticsOptInToggle');
        if (!toggle)
            return;
        toggle.addEventListener('change', () => {
            getSettingsStateInstance().updateSettings({ analyticsOptIn: toggle.checked });
        });
    }
    initNotificationControls() {
        const enableBtn = $('notificationEnableBtn');
        const disableBtn = $('notificationDisableBtn');
        enableBtn?.addEventListener('click', async () => {
            if (!enableBtn)
                return;
            enableBtn.disabled = true;
            const granted = await enableNotifications();
            enableBtn.disabled = false;
            if (granted) {
                this.notificationUI.showAlert('Promemoria attivati.', 'info');
            }
            else {
                this.notificationUI.showAlert('Permesso negato.', 'warning');
            }
            this.notificationUI.refresh(getSettingsStateInstance().getSettings());
        });
        disableBtn?.addEventListener('click', async () => {
            if (!disableBtn)
                return;
            disableBtn.disabled = true;
            await disableNotifications();
            disableBtn.disabled = false;
            this.notificationUI.showAlert('Promemoria disattivati.', 'info');
            this.notificationUI.refresh(getSettingsStateInstance().getSettings());
        });
    }
    initCloudSyncControls() {
        // Simplified for now
    }
    initInstallPrompt() {
        // Simplified for now
    }
    initNamePrompt() {
        const form = $('nameForm');
        const input = $('petNameInput');
        if (!form || !input)
            return;
        form.addEventListener('submit', event => {
            event.preventDefault();
            const rawValue = input.value ?? '';
            getGameStateInstance().setPetName(rawValue);
            recordEvent('nome:impostato');
        });
    }
    initTutorial() {
        const overlay = $('tutorialOverlay');
        const startBtn = $('tutorialStart');
        if (!overlay || !startBtn)
            return;
        const closeOverlay = () => {
            overlay.classList.add('hidden');
        };
        if (getSettingsStateInstance().getSettings().tutorialSeen) {
            closeOverlay();
        }
        startBtn.addEventListener('click', () => {
            getSettingsStateInstance().updateSettings({ tutorialSeen: true });
            closeOverlay();
        });
    }
    initUpdateBanner() {
        const banner = $('updateBanner');
        const accept = $('updateReload');
        const dismiss = $('updateDismiss');
        if (!banner || !accept || !dismiss)
            return;
        accept.addEventListener('click', () => {
            this.updateConfirm?.();
        });
        dismiss.addEventListener('click', () => {
            banner.classList.add('hidden');
            this.updateDismiss?.();
        });
    }
    tempShowUI() {
        document.body.classList.remove('zen-mode');
        setTimeout(() => {
            // Only re-enable zen mode if the toggle is still checked
            const zenToggle = $('zenModeToggle');
            if (zenToggle && zenToggle.checked) {
                document.body.classList.add('zen-mode');
            }
        }, 3000);
    }
}
