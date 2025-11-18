# 🚀 Test PWA in locale

## Prerequisiti
La PWA richiede HTTPS per funzionare (eccetto localhost). Per testarla in locale:

## Metodo 1: Python server (più semplice)

```powershell
# Python 3
python -m http.server 8000

# Apri http://localhost:8000
```

Poi su smartphone (stessa rete WiFi):
1. Trova IP del PC: `ipconfig` (es: 192.168.1.100)
2. Apri su smartphone: `http://192.168.1.100:8000`
3. **PROBLEMA**: Non è HTTPS, quindi PWA non si installa

## Metodo 2: Live Server (VS Code) ⭐ CONSIGLIATO

```powershell
# Installa estensione Live Server in VS Code
# Poi click destro su index.html → "Open with Live Server"
```

Stesso problema: no HTTPS

## Metodo 3: ngrok (HTTPS temporaneo) ✅ FUNZIONA

```powershell
# 1. Scarica ngrok: https://ngrok.com/download
# Oppure con Chocolatey:
choco install ngrok

# 2. Avvia server locale
python -m http.server 8000

# 3. In un'altra finestra PowerShell:
ngrok http 8000

# 4. Copia l'URL https:// che appare (es: https://abc123.ngrok.io)
# 5. Aprilo su smartphone
# 6. Installa la PWA! 🎉
```

**Pro**: Funziona subito, HTTPS incluso
**Contro**: URL temporaneo, scade dopo 2 ore

## Metodo 4: GitHub Pages (MIGLIORE per test prolungati)

```powershell
# 1. Pubblica su GitHub Pages (segui DEPLOY.md)

# 2. Il sito sarà su: https://TUOUSERNAME.github.io/Otter

# 3. Apri su smartphone e installa!
```

**Pro**: URL permanente, HTTPS gratuito, funziona sempre
**Contro**: Richiede 5 minuti setup iniziale

---

## 🧪 Come testare l'installazione PWA

### Android (Chrome)
1. Apri il sito HTTPS
2. Chrome mostrerà banner "Aggiungi a schermata Home"
3. Oppure: Menu (⋮) → "Installa app"
4. L'icona appare nella home con le altre app!

### iOS (Safari)
1. Apri il sito HTTPS
2. Tap pulsante Condividi (quadrato con freccia)
3. Scorri e tap "Aggiungi a Home"
4. Nomina l'app e conferma
5. L'icona appare nella home!

### Desktop (Chrome/Edge)
1. Apri il sito
2. Icona "installa" appare nella barra indirizzi
3. Click → installa
4. L'app si apre in finestra separata!

---

## 🔍 Debug PWA

### Chrome DevTools (F12)
- **Application** → Manifest: verifica configurazione
- **Application** → Service Workers: verifica registrazione
- **Lighthouse**: score PWA (deve essere >90)

### Comandi utili

```javascript
// In console browser (F12):

// Verifica se SW è registrato
navigator.serviceWorker.getRegistrations().then(r => console.log(r));

// Forza aggiornamento SW
navigator.serviceWorker.getRegistrations().then(r => r[0].update());

// Rimuovi SW (per debug)
navigator.serviceWorker.getRegistrations().then(r => r[0].unregister());
```

---

## ✅ Checklist test PWA

- [ ] Manifest.json carica senza errori (DevTools → Application → Manifest)
- [ ] Service Worker registrato (DevTools → Application → Service Workers)
- [ ] Icone 192x192 e 512x512 esistono
- [ ] App installabile (mostra banner/icona installa)
- [ ] Funziona offline (chiudi WiFi, ricarica pagina)
- [ ] Icona home screen corretta
- [ ] Splash screen appare all'avvio
- [ ] Barra indirizzi nascosta (modalità standalone)

---

## 🎯 Prossimi passi

1. **Testa in locale** con ngrok
2. **Pubblica su GitHub Pages** per test stabili
3. **Condividi con amici** per feedback
4. **Se funziona bene** → valuta Play Store (Capacitor)

---

**Buon testing! 🦦**
