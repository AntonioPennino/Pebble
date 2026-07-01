import { $ } from './utils.js';

// Time-of-day ambient light: a handful of keyframes blended continuously across
// the real clock, so the light shifts gradually instead of snapping day/night.
interface LightKeyframe {
    hour: number;
    r: number;
    g: number;
    b: number;
    a: number;
}

const LIGHT_KEYFRAMES: LightKeyframe[] = [
    { hour: 0, r: 20, g: 30, b: 60, a: 0.32 },   // deep night
    { hour: 5, r: 20, g: 30, b: 60, a: 0.32 },   // still night
    { hour: 7, r: 255, g: 183, b: 130, a: 0.22 }, // dawn
    { hour: 9, r: 255, g: 255, b: 255, a: 0 },    // clear day
    { hour: 17, r: 255, g: 255, b: 255, a: 0 },   // clear day
    { hour: 19, r: 255, g: 150, b: 90, a: 0.2 },  // dusk
    { hour: 21, r: 20, g: 30, b: 60, a: 0.32 },   // night
    { hour: 24, r: 20, g: 30, b: 60, a: 0.32 }
];

const TIME_OF_DAY_CHECK_INTERVAL_MS = 5 * 60 * 1000;

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function computeAmbientColor(hourFraction: number): string {
    for (let i = 0; i < LIGHT_KEYFRAMES.length - 1; i++) {
        const from = LIGHT_KEYFRAMES[i];
        const to = LIGHT_KEYFRAMES[i + 1];
        if (hourFraction >= from.hour && hourFraction <= to.hour) {
            const t = (hourFraction - from.hour) / (to.hour - from.hour);
            const r = lerp(from.r, to.r, t);
            const g = lerp(from.g, to.g, t);
            const b = lerp(from.b, to.b, t);
            const a = lerp(from.a, to.a, t);
            return `rgba(${r.toFixed(0)}, ${g.toFixed(0)}, ${b.toFixed(0)}, ${a.toFixed(3)})`;
        }
    }
    const last = LIGHT_KEYFRAMES[LIGHT_KEYFRAMES.length - 1];
    return `rgba(${last.r}, ${last.g}, ${last.b}, ${last.a})`;
}

function updateAmbientLight(): void {
    const overlay = $('ambientLight');
    if (!overlay) return;
    const now = new Date();
    const hourFraction = now.getHours() + now.getMinutes() / 60;
    overlay.style.backgroundColor = computeAmbientColor(hourFraction);
}

function startTimeOfDayLoop(): void {
    updateAmbientLight();
    window.setInterval(updateAmbientLight, TIME_OF_DAY_CHECK_INTERVAL_MS);
}

// Ambient particles: cheap CSS-driven floating specks so otherwise-empty scenes
// feel alive without needing new illustrated art.
interface ParticleSceneConfig {
    sceneId: string;
    variant: string;
    count: number;
}

const PARTICLE_SCENES: ParticleSceneConfig[] = [
    { sceneId: 'denPage', variant: 'dust', count: 12 },
    { sceneId: 'kitchenPage', variant: 'pollen', count: 10 },
    { sceneId: 'hygienePage', variant: 'bubble', count: 12 }
];

function randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

function injectParticles(config: ParticleSceneConfig): void {
    const scene = document.getElementById(config.sceneId);
    if (!scene || scene.querySelector('.ambient-particles')) return;

    const container = document.createElement('div');
    container.className = 'ambient-particles';

    for (let i = 0; i < config.count; i++) {
        const particle = document.createElement('span');
        particle.className = `ambient-particle particle-${config.variant}`;
        particle.style.left = `${randomBetween(4, 96)}%`;
        particle.style.bottom = `${randomBetween(-10, 20)}%`;
        particle.style.animationDuration = `${randomBetween(9, 18)}s`;
        particle.style.animationDelay = `-${randomBetween(0, 18)}s`;
        const size = randomBetween(4, 9);
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        container.appendChild(particle);
    }

    scene.insertBefore(container, scene.firstChild);
}

export function initAmbientAtmosphere(): void {
    PARTICLE_SCENES.forEach(injectParticles);
    startTimeOfDayLoop();
}
