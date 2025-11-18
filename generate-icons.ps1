# Script per generare icone PWA
# Richiede ImageMagick: https://imagemagick.org/script/download.php

Write-Host "🦦 Generazione icone OtterCare PWA" -ForegroundColor Cyan
Write-Host ""

# Check if ImageMagick is installed
try {
    $null = magick -version
} catch {
    Write-Host "❌ ImageMagick non trovato!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installalo con:" -ForegroundColor Yellow
    Write-Host "  choco install imagemagick" -ForegroundColor White
    Write-Host "  oppure scarica da: https://imagemagick.org/script/download.php" -ForegroundColor White
    Write-Host ""
    Write-Host "ALTERNATIVA: Usa questo generatore online:" -ForegroundColor Cyan
    Write-Host "  https://www.pwabuilder.com/imageGenerator" -ForegroundColor White
    Write-Host "  Carica un'immagine 512x512 della lontra e scarica il pacchetto" -ForegroundColor White
    exit 1
}

# Crea un'icona base con emoji (temporanea - sostituisci poi con grafica custom)
$svg = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#66cdaa" rx="80"/>
  <text x="256" y="380" font-size="320" text-anchor="middle" font-family="Arial">🦦</text>
</svg>
"@

$svg | Out-File -Encoding UTF8 icon-temp.svg

# Genera icone
Write-Host "📦 Generazione icon-192.png..." -ForegroundColor Yellow
magick -background none icon-temp.svg -resize 192x192 icon-192.png

Write-Host "📦 Generazione icon-512.png..." -ForegroundColor Yellow
magick -background none icon-temp.svg -resize 512x512 icon-512.png

# Cleanup
Remove-Item icon-temp.svg

Write-Host ""
Write-Host "✅ Icone create con successo!" -ForegroundColor Green
Write-Host "   - icon-192.png" -ForegroundColor White
Write-Host "   - icon-512.png" -ForegroundColor White
Write-Host ""
Write-Host "💡 Suggerimento: Sostituisci queste icone con grafica custom più tardi" -ForegroundColor Cyan
