# 🚀 Guida pubblicazione GitHub Pages

## Passaggi per pubblicare OtterCare online gratuitamente

### 1. Inizializza repository Git (se non già fatto)

```powershell
# Apri PowerShell nella cartella Otter
cd c:\Users\penni\Documents\GitHub\Otter

# Inizializza Git
git init

# Aggiungi tutti i file
git add .

# Primo commit
git commit -m "Initial commit: OtterCare v2.0 con lontra migliorata"
```

### 2. Crea repository su GitHub

1. Vai su [github.com](https://github.com) e fai login
2. Clicca sul pulsante `+` in alto a destra → `New repository`
3. Nome repository: `Otter` (o `OtterCare`)
4. Descrizione: `🦦 Gioco web di cura della lontra - ispirato a Pou ma più tenero`
5. **Lascia il repo pubblico** (necessario per GitHub Pages gratuito)
6. **NON** aggiungere README, .gitignore o license (li hai già)
7. Clicca `Create repository`

### 3. Collega repository locale a GitHub

```powershell
# Copia l'URL del tuo nuovo repo (es. https://github.com/tuousername/Otter.git)
git remote add origin https://github.com/TUOUSERNAME/Otter.git

# Rinomina branch a main (se necessario)
git branch -M main

# Pusha su GitHub
git push -u origin main
```

### 4. Abilita GitHub Pages

1. Nel tuo repository su GitHub, vai su `Settings` (⚙️)
2. Nella barra laterale sinistra, clicca su `Pages`
3. Sotto "Source", seleziona:
   - **Branch**: `main`
   - **Folder**: `/ (root)`
4. Clicca `Save`
5. Aspetta 1-2 minuti

### 5. Visita il tuo sito!

Il gioco sarà disponibile su:
```
https://TUOUSERNAME.github.io/Otter/
```

Ad esempio: `https://penni.github.io/Otter/`

---

## 📝 Aggiornare il gioco dopo modifiche

Ogni volta che modifichi il codice:

```powershell
# Aggiungi modifiche
git add .

# Commit con messaggio descrittivo
git commit -m "Aggiunta nuova animazione per la lontra"

# Pusha su GitHub
git push

# Il sito si aggiornerà automaticamente in 1-2 minuti
```

---

## 🎨 Personalizza URL (opzionale)

### Opzione 1: Usa un dominio personalizzato
1. Compra un dominio (es. su Namecheap, Google Domains)
2. In Settings → Pages, aggiungi il tuo dominio custom
3. Configura DNS del dominio per puntare a GitHub Pages

### Opzione 2: Rinomina repository
Se rinomini il repo in `TUOUSERNAME.github.io`, il sito sarà direttamente su:
```
https://TUOUSERNAME.github.io/
```
(senza `/Otter/` alla fine)

---

## 📊 Aggiungi badge al README

Aggiungi questi badge in cima al tuo `README.md`:

```markdown
# OtterCare 🦦

![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen?style=flat-square&logo=github)
![Version](https://img.shields.io/badge/version-2.0-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-orange?style=flat-square)

**[🎮 Gioca ora!](https://TUOUSERNAME.github.io/Otter/)**

Un adorabile gioco web per prendersi cura di una lontra...
```

---

## 🔧 Troubleshooting

### Il sito non si carica
- Aspetta 5-10 minuti dopo il primo push
- Controlla che il repository sia pubblico
- Verifica che `index.html` sia nella root del repo

### CSS/JS non funzionano
- Controlla i percorsi dei file (devono essere relativi)
- Apri la console browser (F12) per vedere errori

### Modifiche non visibili
- Aspetta qualche minuto
- Fai un hard refresh: `Ctrl + Shift + R` (Windows) o `Cmd + Shift + R` (Mac)
- Svuota cache del browser

---

## 📱 Condividi il tuo gioco!

Una volta pubblicato:
- Condividi il link sui social
- Chiedi feedback ad amici
- Posta su Reddit ([r/WebGames](https://reddit.com/r/WebGames))
- Invia a community di game dev

---

## 🌟 Prossimi passi

1. ✅ Pubblica su GitHub Pages
2. 📊 Aggiungi Google Analytics (opzionale)
3. 🎨 Personalizza ancora di più la lontra
4. 🎮 Aggiungi più mini-giochi
5. 📢 Promuovi il gioco!

---

**Buona fortuna con OtterCare! 🦦💚**

Se hai bisogno di aiuto, apri una Issue su GitHub o contatta la community di sviluppatori.
