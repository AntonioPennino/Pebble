import { advanceTick, ensurePersistentStorage, loadState, saveState } from './state.js';
import { initUI, prepareUpdatePrompt } from './ui.js';

function setupServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
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

  navigator.serviceWorker.register('/OtterCare/sw.js').then(registration => {
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
  }).catch(error => {
    console.warn('Impossibile registrare il Service Worker', error);
  });
}

function promptForUpdate(worker: ServiceWorker): void {
  prepareUpdatePrompt(() => {
    worker.postMessage({ type: 'SKIP_WAITING' });
  }, () => {
    // Nessuna azione aggiuntiva per ora
  });
}

function bootstrap(): void {
  loadState();
  void ensurePersistentStorage();
  initUI();
  setupServiceWorker();

  window.setInterval(() => advanceTick(), 5000);
  window.setInterval(() => saveState(), 60000);
  window.addEventListener('beforeunload', () => saveState());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootstrap();
  });
} else {
  bootstrap();
}
