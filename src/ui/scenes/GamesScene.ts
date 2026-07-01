import { $ } from '../utils.js';
import { audioManager } from '../../core/audio.js';
import { openMiniGame } from '../../features/minigame.js';
import { getGameServiceInstance } from '../../bootstrap.js';
import { handleTouchDrag } from '../utils/dragUtils.js';
import { SceneContext } from './SceneContext.js';

export class GamesScene {
    private currentAnimationId: number | null = null;
    private stars: { x: number, y: number, connected: boolean, id: number }[] = [];
    private connections: { from: number, to: number }[] = [];

    constructor(private ctx: SceneContext) { }

    public init(): void {
        const playBtn = document.getElementById('playBtn');
        playBtn?.addEventListener('click', () => {
            openMiniGame();
        });

        // Stone Polishing (Now Stone Stacking)
        const stoneBtn = document.getElementById('stonePolishingStartBtn');
        stoneBtn?.addEventListener('click', () => {
            const overlay = $('stoneStackingOverlay');
            if (overlay) overlay.classList.remove('hidden');
        });

        this.initStoneStacking();

        // The Current (Water Flow)
        const currentStartBtn = document.getElementById('currentRitualStartBtn');
        currentStartBtn?.addEventListener('click', () => {
            const overlay = $('currentRitualOverlay');
            if (overlay) {
                overlay.classList.remove('hidden');
                this.startCurrentAnimation();
            }
        });

        this.initCurrentRitual();

        // Firefly Connection (Constellations)
        const fireflyStartBtn = document.getElementById('fireflyRitualStartBtn');
        fireflyStartBtn?.addEventListener('click', () => {
            const overlay = $('fireflyRitualOverlay');
            if (overlay) {
                overlay.classList.remove('hidden');
                this.startFireflyLevel();
            }
        });

        this.initFireflyRitual();
    }

    private initCurrentRitual(): void {
        const overlay = $('currentRitualOverlay');
        const closeBtn = $('closeCurrentRitual');

        if (!overlay || !closeBtn) return;

        // Clone to remove old listeners
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode?.replaceChild(newCloseBtn, closeBtn);

        newCloseBtn.addEventListener('click', () => {
            overlay.classList.add('hidden');
            if (this.currentAnimationId) {
                cancelAnimationFrame(this.currentAnimationId);
                this.currentAnimationId = null;
            }
        });
    }

    private startCurrentAnimation(): void {
        const canvas = $('currentCanvas');
        if (!canvas) return;

        canvas.innerHTML = ''; // Clear
        const particles: { x: number, y: number, speed: number, size: number, element: HTMLElement }[] = [];

        // Create particles
        for (let i = 0; i < 50; i++) {
            const p = document.createElement('div');
            p.classList.add('flow-particle');
            const size = Math.random() * 20 + 10;
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            canvas.appendChild(p);

            particles.push({
                x: Math.random() * canvas.offsetWidth,
                y: Math.random() * canvas.offsetHeight,
                speed: Math.random() * 2 + 1,
                size: size,
                element: p
            });
        }

        let mouseX = -1000;
        let mouseY = -1000;
        let lastCalmRequest = 0;

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        });

        canvas.addEventListener('touchmove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.touches[0].clientX - rect.left;
            mouseY = e.touches[0].clientY - rect.top;
        }, { passive: true });

        const animate = () => {
            particles.forEach(p => {
                p.y += p.speed;

                // Interaction: Repel from mouse/touch
                const dx = p.x - mouseX;
                const dy = p.y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 100) {
                    const angle = Math.atan2(dy, dx);
                    p.x += Math.cos(angle) * 5;
                    p.y += Math.sin(angle) * 5;

                    // Chance to find glass
                    const rewardResult = getGameServiceInstance().rewardTheCurrent();
                    if (rewardResult) {
                        if (Math.random() < 0.1) this.ctx.notificationUI.showAlert('+1 Glass', 'info');
                    } else if (getGameServiceInstance().getDailyUsage('current') >= 10) {
                        // Notification for Calm River (debounced)
                        const now = Date.now();
                        if (now - lastCalmRequest > 5000) {
                            this.ctx.notificationUI.showAlert('La corrente si è calmata...', 'warning');
                            lastCalmRequest = now;
                        }
                    }
                }

                // Reset if out of bounds
                if (p.y > canvas.offsetHeight + 50) {
                    p.y = -50;
                    p.x = Math.random() * canvas.offsetWidth;
                }
                if (p.x > canvas.offsetWidth + 50) p.x = -50;
                if (p.x < -50) p.x = canvas.offsetWidth + 50;

                p.element.style.transform = `translate(${p.x}px, ${p.y}px)`;
            });

            this.currentAnimationId = requestAnimationFrame(animate);
        };

        animate();
    }

    private initStoneStacking(): void {
        const overlay = $('stoneStackingOverlay');
        const closeBtn = $('closeStoneStacking');
        const dropZone = $('stoneDropZone');
        const sourceStones = document.querySelectorAll('.draggable-stone');

        if (!overlay || !closeBtn || !dropZone) return;

        // Remove existing listeners to avoid duplicates
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode?.replaceChild(newCloseBtn, closeBtn);

        newCloseBtn.addEventListener('click', () => {
            // Check for reward before closing
            const relativeHeight = stackHeight - 40;
            const reward = getGameServiceInstance().rewardStoneStacking(relativeHeight);
            if (reward > 0) {
                this.ctx.notificationUI.showAlert(`Hai trovato ${reward} river glass!`, 'info');
            } else if (relativeHeight > 100 && getGameServiceInstance().getDailyUsage('stones') >= 25) {
                this.ctx.notificationUI.showAlert('Hai trovato l\'equilibrio (ma niente cristalli).', 'info');
            }

            overlay.classList.add('hidden');
            resetStack();
        });

        let stackHeight = 40; // Base stone height
        let balanceScore = 0; // 0 = perfect balance. +/- means tipping left/right.
        const BALANCE_THRESHOLD = 150;

        const resetStack = () => {
            dropZone.innerHTML = '<div class="base-stone"></div>';
            stackHeight = 40;
            balanceScore = 0;
        };

        const placeStone = (size: string, manualOffset?: number) => {
            const newStone = document.createElement('div');
            newStone.classList.add('stone', 'stacked-stone');

            // Use rock.png asset
            newStone.textContent = '';
            const img = document.createElement('img');
            img.src = 'src/assets/menu-icons/rock.png';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            newStone.appendChild(img);

            let weight = 1;
            let width = 60;
            let height = 40;

            // Size logic
            if (size === 'large') {
                width = 100; height = 60; weight = 3;
            } else if (size === 'medium') {
                width = 80; height = 50; weight = 2;
            } else {
                width = 60; height = 40; weight = 1;
            }

            newStone.style.width = `${width}px`;
            newStone.style.height = `${height}px`;
            newStone.style.display = 'flex';
            newStone.style.alignItems = 'center';
            newStone.style.justifyContent = 'center';

            // Physics / Offset
            let offset = 0;
            if (typeof manualOffset === 'number') {
                offset = manualOffset;
            } else {
                // Fallback to random if dropped via keyboard or unknown?
                offset = (Math.random() - 0.5) * 50;
            }

            // Calculate new balance
            balanceScore += offset * weight;

            // Visual positioning
            newStone.style.bottom = `${stackHeight}px`;
            newStone.style.left = `calc(50% + ${offset}px)`;

            // Rotation reflects instability
            const lean = balanceScore / 10;
            newStone.style.transform = `translateX(-50%) rotate(${lean}deg)`;

            dropZone.appendChild(newStone);

            // Check collapse
            if (Math.abs(balanceScore) > BALANCE_THRESHOLD) {
                // COLLAPSE VISUALS
                if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
                void audioManager.playSFX('splash', true);
                this.ctx.notificationUI.showAlert('Crollato!', 'error');

                // Animate falling
                const stones = dropZone.querySelectorAll('.stacked-stone');
                stones.forEach((s) => {
                    (s as HTMLElement).style.transition = 'transform 0.5s ease-in, top 0.5s ease-in';
                    (s as HTMLElement).style.transform += ` translateY(500px) rotate(${Math.random() * 360}deg)`;
                    (s as HTMLElement).style.opacity = '0';
                });

                setTimeout(() => {
                    resetStack();
                }, 600);
                return;
            }

            stackHeight += height * 0.4; // Tighter overlap (was 0.8)

            if (navigator.vibrate) navigator.vibrate(20);

            if (stackHeight > 300) {
                if (Math.abs(balanceScore) < 50) {
                    this.ctx.notificationUI.showAlert('Equilibrio Zen!', 'success');
                }
            }
        };

        sourceStones.forEach(stone => {
            // Desktop Drag
            stone.addEventListener('dragstart', (e) => {
                const dragEvent = e as DragEvent;
                dragEvent.dataTransfer?.setData('text/plain', (stone as HTMLElement).dataset.size || 'medium');
                dragEvent.dataTransfer?.setData('source', 'stone');
            });

            // Mobile Touch
            stone.addEventListener('touchstart', (e) => {
                const touchEvent = e as TouchEvent;
                touchEvent.preventDefault();
                const size = (stone as HTMLElement).dataset.size || 'medium';
                handleTouchDrag(stone as HTMLElement, touchEvent.touches[0], (elementUnder, x, y) => {
                    if (elementUnder && (elementUnder === dropZone || dropZone.contains(elementUnder))) {
                        // Calculate offset
                        const rect = dropZone.getBoundingClientRect();
                        const centerX = rect.left + rect.width / 2;
                        const dropX = x ?? centerX;
                        const offset = dropX - centerX;
                        placeStone(size, offset);
                    }
                });
            });
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            const size = e.dataTransfer?.getData('text/plain');
            const source = e.dataTransfer?.getData('source');

            if (source !== 'stone' || !size) return;

            // Calculate Offset
            const rect = dropZone.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const offset = e.clientX - centerX;

            placeStone(size, offset);
        });
    }

    private initFireflyRitual(): void {
        const overlay = $('fireflyRitualOverlay');
        const closeBtn = $('closeFireflyRitual');

        if (!overlay || !closeBtn) return;

        // Clone to remove old listeners
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode?.replaceChild(newCloseBtn, closeBtn);

        newCloseBtn.addEventListener('click', () => {
            overlay.classList.add('hidden');
            // Reset logic if needed
        });
    }

    private startFireflyLevel(): void {
        const canvas = $('fireflyCanvas') as HTMLCanvasElement;
        if (!canvas) return;

        // Resize canvas
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Generate Stars Helper
        const generateStars = () => {
            this.stars = [];
            this.connections = [];
            for (let i = 0; i < 8; i++) {
                this.stars.push({
                    x: Math.random() * (canvas.width - 100) + 50,
                    y: Math.random() * (canvas.height - 100) + 50,
                    connected: false,
                    id: i
                });
            }
        };

        generateStars();

        let isDragging = false;
        let startStar: number | null = null;
        let currentMouse = { x: 0, y: 0 };

        const getStarAt = (x: number, y: number) => {
            return this.stars.find(s => Math.hypot(s.x - x, s.y - y) < 30);
        };

        const startHandler = (x: number, y: number) => {
            const star = getStarAt(x, y);
            if (star) {
                isDragging = true;
                startStar = star.id;
                currentMouse = { x, y };
            }
        };

        const moveHandler = (x: number, y: number) => {
            if (isDragging) {
                currentMouse = { x, y };
                draw();
            }
        };

        const endHandler = (x: number, y: number) => {
            if (isDragging && startStar !== null) {
                const targetStar = getStarAt(x, y);
                if (targetStar && targetStar.id !== startStar) {
                    // Connect!
                    const alreadyConnected = this.connections.some(c =>
                        (c.from === startStar && c.to === targetStar.id) ||
                        (c.from === targetStar.id && c.to === startStar)
                    );

                    if (!alreadyConnected) {
                        this.connections.push({ from: startStar, to: targetStar.id });
                        if (navigator.vibrate) navigator.vibrate(10);

                        // Reward!
                        if (getGameServiceInstance().rewardFireflyConnection()) {
                            // Small reward
                        }

                        // Check Completion (All stars used in at least one connection)
                        const connectedSet = new Set<number>();
                        this.connections.forEach(c => {
                            connectedSet.add(c.from);
                            connectedSet.add(c.to);
                        });

                        if (connectedSet.size === this.stars.length) {
                            // WIN!
                            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                            void audioManager.playSFX('happy', true);
                            this.ctx.notificationUI.showAlert('Costellazione completata!', 'success');

                            // Visual fanfare?
                            ctx!.fillStyle = 'rgba(255, 255, 255, 0.8)';
                            ctx!.fillRect(0, 0, canvas.width, canvas.height);

                            // Reset level after brief pause
                            setTimeout(() => {
                                generateStars(); // Re-generate
                                draw();
                            }, 1500);
                        }
                    }
                }
                draw();
            }
        };

        const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw connections
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            this.connections.forEach(c => {
                const s1 = this.stars.find(s => s.id === c.from);
                const s2 = this.stars.find(s => s.id === c.to);
                if (s1 && s2) {
                    ctx.beginPath();
                    ctx.moveTo(s1.x, s1.y);
                    ctx.lineTo(s2.x, s2.y);
                    ctx.stroke();
                }
            });

            // Draw drag line
            if (isDragging) {
                const s = this.stars.find(star => star.id === startStar);
                if (s) {
                    ctx.beginPath();
                    ctx.moveTo(s.x, s.y);
                    ctx.lineTo(currentMouse.x, currentMouse.y);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.stroke();
                }
            }

            // Draw stars
            this.stars.forEach(star => {
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(star.x, star.y, 4, 0, Math.PI * 2);
                ctx.fill();
                // Glow
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(star.x, star.y, 10, 0, Math.PI * 2);
                ctx.fill();
            });
        };

        canvas.addEventListener('mousedown', (e) => startHandler(e.offsetX, e.offsetY));
        canvas.addEventListener('mousemove', (e) => moveHandler(e.offsetX, e.offsetY));
        canvas.addEventListener('mouseup', (e) => {
            endHandler(e.offsetX, e.offsetY);
            isDragging = false;
            draw();
        });

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            startHandler(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            moveHandler(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const t = e.changedTouches[0];
            endHandler(t.clientX - rect.left, t.clientY - rect.top);
            isDragging = false;
            draw();
        });

        draw();
    }
}
