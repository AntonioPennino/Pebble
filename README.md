# Pebble 🦦 — Gioco di cura della lontra

Un adorabile gioco web per prendersi cura di una lontra, ispirato a Pou ma con un'estetica più tenera, rilassante e naturale ("Zen-core").

**🎮 [GIOCA ORA](https://antoniopennino.github.io/Pebble/)** | 📱 Installabile su Android & iOS via PWA o Native

## ✨ Nuove Caratteristiche

Pebble è cresciuto molto! Oltre alla cura di base, ora include:

- **📔 Diario & Statistiche**: Un nuovo hub centrale per monitorare i progressi, l'umore (Soul System) e l'inventario. Include la **Zen Mode** per nascondere l'interfaccia e godersi l'atmosfera.
- **✨ 3 Nuovi Rituali (Minigiochi)**:
  - **L'Equilibrio (Stone Stacking)**: Impila le pietre zen cercando stabilità e armonia.
  - **Le Costellazioni**: Unisci le stelle nel cielo notturno per formare figure luminose.
  - **La Corrente**: Interagisci con il flusso dell'acqua in un'esperienza meditativa.
- **🎒 Il Mercante Itinerante**: Tieni d'occhio il fiume! Un mercante appare occasionalmente per vendere accessori unici (Cappelli di paglia, Sciarpe, Occhiali da sole) in cambio di "Vetri di Mare".
- **🎁 Bonus Giornaliero**: Torna ogni giorno per riscattare ricompense crescenti e oggetti speciali.
- **☁️ Cloud Sync Migliorato**: Sincronizzazione affidabile con Supabase per non perdere mai i progressi tra dispositivi.
- **📱 Supporto Nativo (Capacitor)**: Il progetto è ora configurato per generare app native Android e iOS reali, oltre alla versione PWA.

## 🕹️ Gameplay

1. **Cura**: Nutri, lava e gioca con Pebble per mantenere alto il suo umore. Le espressioni cambiano dinamicamente!
2. **Ciclo Giorno/Notte**: Interagisci con la lanterna nella tana per mettere a dormire Pebble.
3. **Esplora**: Scorri tra le scene (Tana, Cucina, Fiume, Giochi) per scoprire attività diverse.
4. **Colleziona**: Trova "Vetri di Mare" (valuta) e oggetti rari tramite i rituali e il mercante.

## 📱 Mobile: PWA vs Nativo

Hai due modi per giocare su mobile:

1. **PWA (Consigliato per iniziare)**: Apri il sito su Chrome/Safari e premi "Aggiungi a Schermata Home". Funziona offline e a schermo intero.
2. **App Nativa (Capacitor)**: Per gli sviluppatori, è possibile compilare `.apk` e `.ipa` reali usando Capacitor.
   
👉 **Vedi la guida completa [MOBILE.md](MOBILE.md) per i dettagli di installazione e build.**

## 🧱 Struttura Aggiornata

```
Pebble/
├── assets/                  # Immagini, icone e suoni
├── src/
│   ├── core/                # Logica di gioco (GameState, Audio, Analytics)
│   ├── features/            # Logica minigiochi (Pesca, Stone Polishing*)
│   ├── ui/                  # Gestione Interfaccia
│   │   ├── components/      # Componenti modulari (HUD, Modal, Renderer)
│   │   └── UIManager.ts     # Orchestrator principale della UI
│   ├── bootstrap.ts         # Inizializzazione servizi
│   └── index.ts             # Entry point
├── android/ & ios/          # Progetti nativi Capacitor
├── dist/                    # Output build
├── index.html               # Entry point applicazione
├── MOBILE.md                # Guida deployment mobile
└── package.json             # Dipendenze (incluso @capacitor)
```

## 🛠️ Sviluppo Locale

Il progetto usa **TypeScript** e **Vite** (o script custom) per la build.

```powershell
# Installa dipendenze
npm install

# Avvia server di sviluppo locale
npm run serve
# oppure
npm run dev

# Compila TypeScript e asset per produzione
npm run build

# Build mobile (dopo aver configurato l'ambiente Android/iOS)
npx cap sync
npx cap open android
```

## ☁️ Cloud Sync (Supabase)

La sincronizzazione salva i dati nel cloud in modo sicuro e anonimo.
Per abilitarla, crea un file `config.js` (basato su `config.example.js`) con le tue chiavi Supabase.
Il gioco fornisce un **Codice di Recupero** nel Diario: salvalo per ripristinare i dati su altri dispositivi.

## 📄 Licenza

**Copyright © 2025 Antonio Pennino**
Distribuito sotto licenza **CC BY-NC-ND 4.0**.
Vedi `LICENSE` per i dettagli.

---

*Creato con 🦦 e ❤️ per chi ama i giochi slow-life.*
