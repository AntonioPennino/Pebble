# OtterCare 🦦 — Gioco di cura della lontra

Un adorabile gioco web per prendersi cura di una lontra, ispirato a Pou ma con un'estetica più tenera e meno inquietante.

## ✨ Caratteristiche

### Sistema di cura completo
- **Statistiche vitali**: Fame, Felicità, Pulizia, Energia (con barre colorate dinamiche)
- **Azioni interattive**: 
  - 🍎 Dai da mangiare (aumenta fame & felicità)
  - 🎮 Gioca (mini-gioco con pesci, guadagna monete)
  - 💧 Bagna (aumenta pulizia)
  - 😴 Fai dormire (recupera energia)

### Lontra animata avanzata
- **SVG dettagliata** con corpo, testa, zampe, coda e orecchie
- **Espressioni facciali dinamiche**: felice, triste, assonnato, neutrale
- **Animazioni fluide**:
  - Salto quando mangia
  - Scuotimento quando si bagna
  - Battito ciglia periodico
  - Movimento della coda quando è felice
  - Effetto sonno con filtro grayscale

### Sistema emotivo
- La lontra cambia espressione in base alle sue statistiche
- Guance arrossate quando è molto felice
- Sopracciglia espressive
- Stati d'animo realistici

### Audio
- Effetti sonori semplici usando Web Audio API
- Suoni per mangiare, giocare, bagnare

### Mini-gioco
- **Cattura pesci**: clicca i pesci che appaiono per guadagnare monete e felicità
- Timer di 10 secondi
- Ricompense dinamiche

### Negozio
- Compra accessori con le monete guadagnate
- Cappello decorativo (demo)
- Espandibile con più oggetti

### Salvataggio
- Persistenza automatica con `localStorage`
- Salvataggio ogni 4 secondi
- Caricamento automatico all'avvio

## 🎮 Come giocare

1. Apri `index.html` nel browser (compatibile con tutti i browser moderni)
2. Interagisci con i pulsanti per curare la lontra
3. Gioca al mini-gioco per guadagnare monete
4. Compra accessori nel negozio
5. I tuoi progressi vengono salvati automaticamente!

### 📱 Vuoi giocare su smartphone?
L'app è **installabile su Android e iOS**! Leggi la guida completa in [`MOBILE.md`](MOBILE.md) per:
- PWA (installazione diretta dal browser - gratis)
- Pubblicazione su Play Store e App Store
- Alternative open source (F-Droid)

### Comandi rapidi (Windows PowerShell)
```powershell
# Apri nel browser predefinito
Start-Process .\index.html

# Oppure usa un server locale (opzionale)
python -m http.server 8000
# Poi apri http://localhost:8000
```

## 📋 Meccaniche di gioco

### Decadimento automatico
- Le statistiche calano lentamente nel tempo (ogni 5 secondi)
- Fame, felicità, pulizia ed energia diminuiscono gradualmente
- Se la fame è troppo bassa, la felicità cala più rapidamente
- Barre rosse indicano livelli critici (< 15%)
- Barre arancioni indicano livelli bassi (< 30%)

### Sistema di ricompense
- Giocare al mini-gioco dà monete
- Le monete possono essere spese nel negozio
- Interazioni aumentano la felicità della lontra

## 🎨 Design e UX

- **Palette colori**: toni caldi e naturali (marrone, beige, verde acqua)
- **Animazioni smooth**: cubic-bezier per rimbalzi realistici
- **Responsive**: si adatta a schermi mobili e desktop
- **Accessibilità**: etichette ARIA, contrasti adeguati

## 🔧 Tecnologie utilizzate

- **HTML5** per la struttura
- **CSS3** con animazioni keyframe avanzate
- **Vanilla JavaScript** (nessuna dipendenza)
- **SVG** per grafica vettoriale scalabile
- **Web Audio API** per effetti sonori
- **LocalStorage API** per persistenza

## 🚀 Espansioni future suggerite

### Grafica
- [ ] Più sprite/pose per la lontra (nuotare, correre)
- [ ] Sfondi animati (stagioni, giorno/notte)
- [ ] Particelle (bolle, cuori, stelle)
- [ ] Più accessori (occhiali, sciarpe, cappelli)

### Gameplay
- [ ] Più mini-giochi (puzzle, memory, catch)
- [ ] Sistema di livelli/esperienza
- [ ] Missioni giornaliere
- [ ] Sblocchi progressivi
- [ ] Tavola di classifiche

### Audio/Visual
- [ ] Musica di sottofondo rilassante
- [ ] Più effetti sonori (libreria Howler.js)
- [ ] Animazioni con anime.js o GSAP
- [ ] Temi personalizzabili

### Tecniche
- [ ] PWA (Progressive Web App) per installazione
- [ ] Sincronizzazione cloud (Firebase)
- [ ] Multiplayer/social (condividi la tua lontra)
- [ ] Versione mobile nativa (Capacitor/Cordova)

## 📦 Struttura file

```
Otter/
├── index.html      # Struttura principale e SVG lontra
├── style.css       # Stili e animazioni
├── main.js         # Logica di gioco e gestione stato
└── README.md       # Documentazione
```

## 🎯 Differenze da Pou

- ✅ Design più tenero e naturalistico
- ✅ Espressioni facciali più varie e delicate
- ✅ Palette colori calda e accogliente
- ✅ Animazioni fluide e non brusche
- ✅ Suoni soft e non invasivi
- ✅ Nessun elemento inquietante o disturbante

## 🤝 Contribuire

Questo è un progetto open-source! Sentiti libero di:
- Aggiungere nuove funzionalità
- Migliorare le animazioni
- Creare più mini-giochi
- Ottimizzare le performance
- Tradurre in altre lingue

## 📄 Licenza

Questo progetto è libero da usare per scopi personali ed educativi.

---

**Buon divertimento con la tua lontra! 🦦💙**

*Creato con ❤️ per chi ama gli animali carini e i giochi rilassanti*