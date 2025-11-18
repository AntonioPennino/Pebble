# Quick Deploy Script per OtterCare
# Uso: .\deploy.ps1 "messaggio commit"

param(
    [string]$Message = "Aggiornamento OtterCare"
)

Write-Host "🦦 OtterCare Deploy Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path .git)) {
    Write-Host "❌ Repository Git non trovato. Inizializzo..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git inizializzato" -ForegroundColor Green
}

# Add all changes
Write-Host "📦 Aggiunta modifiche..." -ForegroundColor Yellow
git add .

# Check if there are changes
$status = git status --porcelain
if (-not $status) {
    Write-Host "ℹ️  Nessuna modifica da committare" -ForegroundColor Cyan
    exit 0
}

# Commit
Write-Host "💾 Commit con messaggio: '$Message'" -ForegroundColor Yellow
git commit -m $Message

# Push to main branch
Write-Host "🚀 Push su GitHub..." -ForegroundColor Yellow
try {
    git push origin main
    Write-Host ""
    Write-Host "✅ Deploy completato con successo!" -ForegroundColor Green
    Write-Host "🌐 Il sito verrà aggiornato in 1-2 minuti su GitHub Pages" -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "⚠️  Remote 'origin' non configurato." -ForegroundColor Yellow
    Write-Host "Esegui prima:" -ForegroundColor Yellow
    Write-Host "  git remote add origin https://github.com/TUOUSERNAME/Otter.git" -ForegroundColor White
    Write-Host "  git branch -M main" -ForegroundColor White
    Write-Host "  git push -u origin main" -ForegroundColor White
}

Write-Host ""
