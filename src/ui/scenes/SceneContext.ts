import { NotificationUI } from '../components/NotificationUI.js';
import { OtterRenderer } from '../components/OtterRenderer.js';

// Shared dependencies handed to each scene so they don't need to reach back into UIManager.
export interface SceneContext {
    notificationUI: NotificationUI;
    otterRenderer: OtterRenderer;
    triggerUpdate: () => void;
}
