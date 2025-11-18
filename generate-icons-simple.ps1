# Generatore icone PWA senza ImageMagick
# Usa solo .NET (già incluso in Windows)

Write-Host "🦦 Generazione icone OtterCare (metodo semplice)" -ForegroundColor Cyan
Write-Host ""

# Carica assembly per disegno
Add-Type -AssemblyName System.Drawing

function New-IconPNG {
    param(
        [int]$Size,
        [string]$OutputPath
    )
    
    # Crea bitmap
    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Sfondo colorato
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(102, 205, 170))
    $graphics.FillRectangle($bgBrush, 0, 0, $Size, $Size)
    
    # Testo emoji (centrato)
    $font = New-Object System.Drawing.Font("Segoe UI Emoji", ($Size * 0.6), [System.Drawing.FontStyle]::Regular)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $text = "🦦"
    
    # Misura testo per centrarlo
    $textSize = $graphics.MeasureString($text, $font)
    $x = ($Size - $textSize.Width) / 2
    $y = ($Size - $textSize.Height) / 2
    
    $graphics.DrawString($text, $font, $textBrush, $x, $y)
    
    # Salva
    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Cleanup
    $graphics.Dispose()
    $bitmap.Dispose()
    $bgBrush.Dispose()
    $textBrush.Dispose()
    $font.Dispose()
}

try {
    Write-Host "📦 Generazione icon-192.png..." -ForegroundColor Yellow
    New-IconPNG -Size 192 -OutputPath "icon-192.png"
    Write-Host "✅ icon-192.png creato" -ForegroundColor Green
    
    Write-Host "📦 Generazione icon-512.png..." -ForegroundColor Yellow
    New-IconPNG -Size 512 -OutputPath "icon-512.png"
    Write-Host "✅ icon-512.png creato" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "🎉 Icone create con successo!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 SUGGERIMENTO:" -ForegroundColor Cyan
    Write-Host "   Per icone più belle, usa https://icon.kitchen" -ForegroundColor White
    Write-Host "   e sostituisci icon-192.png e icon-512.png" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "❌ Errore: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "🌐 USA INVECE UN GENERATORE ONLINE:" -ForegroundColor Yellow
    Write-Host "   1. Vai su https://icon.kitchen" -ForegroundColor White
    Write-Host "   2. Upload emoji lontra 🦦" -ForegroundColor White
    Write-Host "   3. Download e copia icon-192.png e icon-512.png qui" -ForegroundColor White
}
