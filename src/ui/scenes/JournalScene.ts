import { $ } from '../utils.js';
import { audioManager } from '../../core/audio.js';
import { recordEvent } from '../../core/analytics.js';
import { getGameStateInstance } from '../../bootstrap.js';
import { SceneContext } from './SceneContext.js';

export class JournalScene {
    constructor(private ctx: SceneContext) { }

    public init(): void {
        this.initDailyBonus();
        this.initJournal();
    }

    private initDailyBonus(): void {
        const overlay = $('dailyBonusOverlay');
        const closeBtn = $('closeDailyBonusBtn');
        const claimBtn = $('claimDailyBonusBtn') as HTMLButtonElement;
        const grid = $('dailyGrid');

        if (!overlay || !closeBtn || !claimBtn || !grid) return;

        // Open/Close logic
        closeBtn.addEventListener('click', () => {
            overlay.classList.add('hidden');
        });

        const gameState = getGameStateInstance();

        // Render UI
        const renderBonusUI = () => {
            grid.innerHTML = '';

            // Assume 1-7 Day Cycle for Visuals
            const currentStreak = gameState.getDailyStreak();
            const status = gameState.getDailyBonusStatus();

            // Calculate "Visual Cycle" base (0, 7, 14...)
            let cycleBase = Math.floor(currentStreak / 7) * 7;
            if (currentStreak > 0 && currentStreak % 7 === 0 && !status.canClaim) {
                cycleBase = currentStreak - 7;
            }

            for (let i = 1; i <= 7; i++) {
                const dayNum = cycleBase + i;
                const reward = gameState.getDailyRewardPreview(dayNum);

                const el = document.createElement('div');
                el.className = 'daily-day';

                let isClaimed = dayNum <= currentStreak;
                let isActive = false;
                let isLocked = dayNum > currentStreak;

                if (status.canClaim && dayNum === status.currentDay) {
                    isClaimed = false;
                    isActive = true;
                    isLocked = false;
                }

                if (isClaimed) el.classList.add('claimed');
                if (isActive) el.classList.add('active');
                if (isLocked && !isActive) el.classList.add('locked');

                // Content
                let icon = reward.type === 'seaGlass' ? '💎' : '🎁';
                if (reward.type === 'item') icon = '🎒'; // Specific icon?

                el.innerHTML = `
                    <div class="day-box-label">Giorno ${i}</div>
                    <div class="day-box-reward">${icon}</div>
                    <div style="font-size: 0.8rem; font-weight:bold;">${typeof reward.value === 'number' ? reward.value : ''}</div>
                `;

                grid.appendChild(el);
            }

            if (status.canClaim) {
                claimBtn.disabled = false;
                claimBtn.textContent = 'Riscatta';
            } else {
                claimBtn.disabled = true;
                claimBtn.textContent = 'Torna Domani';
            }
        };

        // Claim Action
        claimBtn.addEventListener('click', () => {
            const result = gameState.claimDailyBonus();
            if (result) {
                if (result.type === 'seaGlass') {
                    this.ctx.notificationUI.showAlert(`Bonus riscosso: ${result.value} Sea Glass!`, 'info');
                } else {
                    this.ctx.notificationUI.showAlert(`Bonus riscosso: ${result.value}!`, 'info');
                }
                void audioManager.playSFX('happy', true);
                if (navigator.vibrate) navigator.vibrate(100);

                renderBonusUI(); // Re-render to show checkmark

                // Close after delay
                setTimeout(() => {
                    overlay.classList.add('hidden');
                }, 1500);
            }
        });

        // Initialize
        renderBonusUI();

        // Auto-show if available (once per calendar day, persistent)
        const today = new Date().toDateString();
        const lastAutoShow = localStorage.getItem('pebble_daily_bonus_last_shown');

        if (gameState.getDailyBonusStatus().canClaim && lastAutoShow !== today) {
            // Tiny delay to ensure load
            setTimeout(() => {
                overlay.classList.remove('hidden');
                void audioManager.playSFX('pop', true);
                localStorage.setItem('pebble_daily_bonus_last_shown', today);
            }, 1000);
        }
    }

    private initJournal(): void {
        const trigger = $('journalTrigger');
        const overlay = $('journalOverlay');
        const closeBtn = $('journalCloseBtn');
        const journalBook = document.querySelector('.journal-book') as HTMLElement;
        const pages = document.querySelectorAll('.journal-page');

        if (!trigger || !overlay || !closeBtn || !journalBook) return;

        let currentPage = 0;
        const updatePageClasses = () => {
            pages.forEach((page, index) => {
                const el = page as HTMLElement;
                if (index < currentPage) {
                    el.classList.add('flipped');
                } else {
                    el.classList.remove('flipped');
                }
            });
        };

        // Open
        trigger.addEventListener('click', () => {
            overlay.classList.remove('hidden');
            this.updateJournalStats();
        });

        const resetBook = () => {
            currentPage = 0;
            updatePageClasses();
        };

        // Close
        closeBtn.addEventListener('click', () => {
            overlay.classList.add('hidden');
            setTimeout(resetBook, 500);
        });

        // Swipe Logic (Touch)
        let touchStartX = 0;

        journalBook.addEventListener('touchstart', (e: TouchEvent) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        journalBook.addEventListener('touchend', (e: TouchEvent) => {
            const touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) < 50) return;

            if (diff > 0) {
                // Next
                if (currentPage < pages.length - 1) {
                    currentPage++;
                    updatePageClasses();
                }
            } else {
                // Prev
                if (currentPage > 0) {
                    currentPage--;
                    updatePageClasses();
                }
            }
        });

        // Click Logic for Desktop
        journalBook.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.tagName === 'LABEL' || target.closest('.toggle-control')) {
                return;
            }

            const rect = journalBook.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const width = rect.width;

            // Left 30% = prev, Rest = next
            if (x < width * 0.3) {
                if (currentPage > 0) {
                    currentPage--;
                    updatePageClasses();
                }
            } else {
                if (currentPage < pages.length - 1) {
                    currentPage++;
                    updatePageClasses();
                }
            }
        });

        // Zen Mode Toggle
        const zenToggle = $('zenModeToggle') as HTMLInputElement;
        if (zenToggle) {
            zenToggle.addEventListener('change', () => {
                if (zenToggle.checked) {
                    document.body.classList.add('zen-mode');
                    overlay.classList.add('hidden'); // Close journal to enjoy Zen
                    this.ctx.notificationUI.showAlert('Zen Mode attiva. Tocca lo schermo per mostrare i controlli.', 'info');
                } else {
                    document.body.classList.remove('zen-mode');
                }
            });
        }

        // Player Name Input
        const playerNameInput = $('playerNameInput') as HTMLInputElement;
        if (playerNameInput) {
            // Load initial value
            playerNameInput.value = getGameStateInstance().getPlayerName();

            playerNameInput.addEventListener('change', (e) => {
                const name = (e.target as HTMLInputElement).value;
                getGameStateInstance().setPlayerName(name);
            });
        }

        // Music Toggle (Nature Sounds)
        const musicToggle = $('musicToggle') as HTMLInputElement;
        if (musicToggle) {
            musicToggle.addEventListener('change', () => {
                // If checked, Muted = false. If unchecked, Muted = true.
                audioManager.setAmbienceMuted(!musicToggle.checked);
            });
        }

        // Update Toast Button
        const updateBtn = $('updateNowBtn');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => {
                this.ctx.triggerUpdate();
                $('updateBanner')?.classList.add('hidden');
            });
        }

        // Export/Import
        const exportBtn = $('exportSaveBtn');
        const importBtn = $('importSaveBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const code = getGameStateInstance().getFullStateString();
                if (code) {
                    navigator.clipboard.writeText(code).then(() => {
                        this.ctx.notificationUI.showAlert('Codice copiato negli appunti! 📋', 'info');
                    });
                } else {
                    this.ctx.notificationUI.showAlert('Errore esportazione.', 'error');
                }
            });
        }
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const code = prompt('Incolla qui il codice di salvataggio (Base64):');
                if (code && code.trim().length > 10) {
                    const success = getGameStateInstance().importStateString(code.trim());
                    if (!success) {
                        this.ctx.notificationUI.showAlert('Codice non valido!', 'error');
                    }
                }
            });
        }
    }

    private updateJournalStats(): void {
        const stats = getGameStateInstance().getStats();

        // Stats
        const statDays = $('statDays');
        const statGames = $('statGames');
        const statFish = $('statFish');
        const statItems = $('statItems');

        if (statDays) statDays.textContent = String(stats.days ?? 1); // Default to 1 if undefined
        if (statGames) statGames.textContent = String(stats.minigamesPlayed ?? 0);
        if (statFish) statFish.textContent = String(stats.fishCaught ?? 0);
        if (statItems) statItems.textContent = String(stats.itemsCollected ?? 0);

        // Status (Soul)
        const hungerEl = $('journalHunger');
        const happyEl = $('journalHappy');

        if (hungerEl) {
            if (stats.hunger >= 80) hungerEl.textContent = 'Piena 🍖';
            else if (stats.hunger >= 40) hungerEl.textContent = 'Soddisfatta 🐟';
            else hungerEl.textContent = 'Affamata... 🥣';
        }

        if (happyEl) {
            if (stats.happiness >= 80) happyEl.textContent = 'Radiosa ✨';
            else if (stats.happiness >= 40) happyEl.textContent = 'Serena 🍃';
            else happyEl.textContent = 'Triste ☁️';
        }
    }

    private renderJournalInventory(): void {
        const container = $('journalInventory');
        if (!container) return;

        const items = getGameStateInstance().getInventory();
        container.innerHTML = '';

        if (items.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #8D6E63; font-style: italic;">Lo zaino è vuoto...</p>';
            return;
        }

        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'inventory-item';
            el.style.width = '50px';
            el.style.height = '50px';
            el.style.background = 'rgba(255,255,255,0.5)';
            el.style.borderRadius = '8px';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.border = '1px solid #D7CCC8';

            const img = document.createElement('img');
            if (item.match(/\p{Emoji}/u)) {
                el.textContent = item;
                el.style.fontSize = '2rem';
            } else {
                img.src = `src/assets/items/${item}.png`;
                img.alt = item;
                img.className = 'item-icon';
                img.onerror = () => { img.style.display = 'none'; el.textContent = '📦'; };
                el.appendChild(img);
            }

            container.appendChild(el);
        });
    }
}
