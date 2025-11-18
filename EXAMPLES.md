// EXAMPLES.md - Esempi di estensioni per OtterCare

## 🎨 Aggiungere nuove espressioni

### 1. Espressione "Annoiato"
```javascript
// In main.js, aggiungi a EXPRESSIONS:
bored: {
  mouth: 'M 54 71 Q 60 71 66 71',  // linea dritta
  leftBrow: 'M 45 44 Q 50 42 55 44',
  rightBrow: 'M 65 44 Q 70 42 75 44'
}

// In updateMood(), aggiungi:
if(state.happy < 40 && state.energy > 50){
  setExpression('bored');
}
```

### 2. Espressione "Affamato"
```javascript
hungry: {
  mouth: 'M 54 72 Q 60 68 66 72',  // bocca tremante
  leftBrow: 'M 45 42 Q 50 39 55 42',
  rightBrow: 'M 65 42 Q 70 39 75 42'
}
```

## 🎬 Nuove animazioni

### Lontra che nuota
```css
/* In style.css */
@keyframes swim {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  25% { transform: translateX(5px) rotate(2deg); }
  75% { transform: translateX(-5px) rotate(-2deg); }
}

#otterSvg.swimming {
  animation: swim 1.2s ease-in-out infinite;
}
```

```javascript
// In main.js
function swim(){
  const svg = $('otterSvg');
  svg.classList.add('swimming');
  setTimeout(() => svg.classList.remove('swimming'), 5000);
}
```

### Stelle quando è felice
```html
<!-- In index.html, dopo foodItem -->
<g id="stars" opacity="0">
  <text x="30" y="40" font-size="20">⭐</text>
  <text x="100" y="35" font-size="18">✨</text>
  <text x="70" y="25" font-size="16">💫</text>
</g>
```

```css
/* In style.css */
#otterSvg.happy #stars {
  opacity: 1;
  animation: starFloat 2s ease-in-out infinite;
}

@keyframes starFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

## 🎮 Nuovo mini-gioco: Memory

```javascript
// In main.js, aggiungi:
function startMemoryGame(){
  const pairs = ['🐟', '🦐', '🦀', '🐙'];
  const cards = [...pairs, ...pairs].sort(() => Math.random() - 0.5);
  let flipped = [];
  let matched = 0;
  
  const grid = document.createElement('div');
  grid.className = 'memory-grid';
  
  cards.forEach((emoji, i) => {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.dataset.value = emoji;
    card.dataset.index = i;
    
    card.addEventListener('click', () => {
      if(flipped.length < 2 && !card.classList.contains('flipped')){
        card.textContent = emoji;
        card.classList.add('flipped');
        flipped.push(card);
        
        if(flipped.length === 2){
          setTimeout(() => {
            if(flipped[0].dataset.value === flipped[1].dataset.value){
              matched++;
              flipped = [];
              if(matched === pairs.length){
                alert('Hai vinto! +50 monete');
                state.coins += 50;
                updateUI(); saveState();
              }
            } else {
              flipped.forEach(c => {
                c.textContent = '';
                c.classList.remove('flipped');
              });
              flipped = [];
            }
          }, 800);
        }
      }
    });
    
    grid.appendChild(card);
  });
  
  document.querySelector('#minigame').appendChild(grid);
}
```

```css
/* In style.css */
.memory-grid {
  display: grid;
  grid-template-columns: repeat(4, 60px);
  gap: 10px;
  margin: 10px 0;
}

.memory-card {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  cursor: pointer;
  transition: transform 0.2s;
}

.memory-card:hover {
  transform: scale(1.05);
}

.memory-card.flipped {
  background: #fff;
}
```

## 🎨 Background animato

```html
<!-- In index.html, dentro main, prima di .game-area -->
<div class="animated-bg">
  <div class="bubble"></div>
  <div class="bubble"></div>
  <div class="bubble"></div>
  <div class="wave"></div>
</div>
```

```css
/* In style.css */
.animated-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.bubble {
  position: absolute;
  bottom: -50px;
  width: 40px;
  height: 40px;
  background: rgba(102, 205, 170, 0.3);
  border-radius: 50%;
  animation: rise 6s infinite ease-in;
}

.bubble:nth-child(2) {
  left: 20%;
  width: 60px;
  height: 60px;
  animation-delay: 2s;
  animation-duration: 8s;
}

.bubble:nth-child(3) {
  left: 60%;
  width: 30px;
  height: 30px;
  animation-delay: 4s;
  animation-duration: 7s;
}

@keyframes rise {
  0% { bottom: -50px; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { bottom: 100vh; opacity: 0; }
}

.wave {
  position: absolute;
  bottom: 0;
  width: 200%;
  height: 100px;
  background: linear-gradient(transparent, rgba(102, 205, 170, 0.1));
  animation: wave 10s linear infinite;
}

@keyframes wave {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

## 💾 Salvataggio cloud con Firebase

```javascript
// 1. Installa Firebase
// npm install firebase

// 2. Inizializza (aggiungi in main.js)
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "ottercare.firebaseapp.com",
  projectId: "ottercare"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3. Modifica saveState()
async function saveToCloud(userId){
  try {
    await setDoc(doc(db, "otters", userId), state);
    console.log("Salvato su cloud!");
  } catch(e) {
    console.error("Errore salvataggio:", e);
  }
}

// 4. Carica da cloud
async function loadFromCloud(userId){
  const docRef = doc(db, "otters", userId);
  const docSnap = await getDoc(docRef);
  if(docSnap.exists()){
    state = docSnap.data();
    updateUI();
  }
}

// 5. Usa un ID utente (puoi usare Firebase Auth o generarne uno)
const userId = localStorage.getItem('userId') || generateUserId();
localStorage.setItem('userId', userId);
```

## 🎵 Musica di sottofondo

```html
<!-- In index.html, prima di </body> -->
<audio id="bgMusic" loop>
  <source src="sounds/calm-music.mp3" type="audio/mpeg">
</audio>
<button id="musicToggle" class="music-btn">🔊</button>
```

```javascript
// In main.js
let musicPlaying = false;
const bgMusic = $('bgMusic');
bgMusic.volume = 0.3;

$('musicToggle').addEventListener('click', () => {
  if(musicPlaying){
    bgMusic.pause();
    $('musicToggle').textContent = '🔇';
  } else {
    bgMusic.play();
    $('musicToggle').textContent = '🔊';
  }
  musicPlaying = !musicPlaying;
});
```

```css
/* In style.css */
.music-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: var(--accent);
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 100;
}

.music-btn:hover {
  transform: scale(1.1);
}
```

## 📊 Sistema di livelli

```javascript
// Aggiungi a DEFAULT in main.js:
level: 1,
xp: 0,
xpToNext: 100

// Funzione per guadagnare XP
function gainXP(amount){
  state.xp += amount;
  while(state.xp >= state.xpToNext){
    state.xp -= state.xpToNext;
    state.level++;
    state.xpToNext = Math.floor(state.xpToNext * 1.5);
    showLevelUp();
  }
  updateUI(); saveState();
}

function showLevelUp(){
  const popup = document.createElement('div');
  popup.className = 'level-up-popup';
  popup.textContent = `🎉 Livello ${state.level}!`;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 3000);
}

// Modifica azioni per dare XP
function feed(){
  // ... existing code
  gainXP(5);
}
```

```css
/* In style.css */
.level-up-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 20px 40px;
  border-radius: 16px;
  font-size: 24px;
  font-weight: bold;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  animation: popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  z-index: 1000;
}

@keyframes popIn {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}
```

## 🌙 Modalità notte/giorno

```javascript
// Rileva ora del giorno
function updateTheme(){
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour > 20;
  document.body.classList.toggle('night-mode', isNight);
}

// Chiama all'avvio e ogni minuto
window.addEventListener('DOMContentLoaded', updateTheme);
setInterval(updateTheme, 60000);
```

```css
/* In style.css */
body.night-mode {
  --bg: #1a1a2e;
  --card: #16213e;
  --accent: #4a90e2;
  background: linear-gradient(180deg, #0f3460, #1a1a2e);
  color: #eaeaea;
}

body.night-mode #otterSvg {
  filter: brightness(0.8);
}

/* Aggiungi stelle nel cielo notturno */
body.night-mode::before {
  content: '⭐';
  position: fixed;
  top: 10%;
  left: 20%;
  font-size: 16px;
  animation: twinkle 3s infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
```

---

**Sperimenta con queste estensioni e crea la tua versione unica di OtterCare! 🦦✨**
