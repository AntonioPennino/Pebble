import { rewardFishCatch, rewardMiniGameStart } from './gameActions.js';
import { playSound } from './audio.js';
let elements = null;
let callbacks = null;
let running = false;
let score = 0;
let intervalId = null;
let timerId = null;
function clearTimers() {
    if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
    }
    if (timerId !== null) {
        window.clearTimeout(timerId);
        timerId = null;
    }
}
function spawnFish(area) {
    const fish = document.createElement('div');
    fish.classList.add('fish');
    fish.textContent = '🐟';
    fish.style.left = `${Math.random() * 80}%`;
    fish.style.top = `${Math.random() * 80}%`;
    fish.addEventListener('click', () => {
        if (!running) {
            return;
        }
        score += 1;
        rewardFishCatch();
        playSound('happy');
        if (elements) {
            elements.score.textContent = String(score);
        }
        fish.remove();
    }, { once: true });
    area.appendChild(fish);
}
export function initMiniGame(el, cb) {
    elements = el;
    callbacks = cb;
    elements.closeButton.addEventListener('click', () => {
        closeMiniGame();
    });
}
export function openMiniGame() {
    if (!elements || running) {
        return;
    }
    running = true;
    score = 0;
    rewardMiniGameStart();
    elements.score.textContent = '0';
    elements.area.innerHTML = '';
    elements.overlay.classList.remove('hidden');
    intervalId = window.setInterval(() => {
        if (!elements) {
            return;
        }
        spawnFish(elements.area);
        if (elements.area.children.length > 7) {
            elements.area.removeChild(elements.area.firstElementChild);
        }
    }, 800);
    timerId = window.setTimeout(() => {
        closeMiniGame();
        if (callbacks) {
            callbacks.onFinish(score);
        }
    }, 10000);
}
export function closeMiniGame() {
    if (!elements) {
        return;
    }
    clearTimers();
    running = false;
    elements.overlay.classList.add('hidden');
}
export function isMiniGameRunning() {
    return running;
}
