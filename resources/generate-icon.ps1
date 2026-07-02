# Genera el icono .ico para QuickBite POS
# Requiere: ImageMagick (https://imagemagick.org)
#
# Uso: Coloca un PNG de 256x256 como "icon.png" en esta carpeta y ejecuta:
#   powershell -File generate-icon.ps1

$pngPath = Join-Path $PSScriptRoot "icon.png"
$icoPath = Join-Path $PSScriptRoot "icon.ico"

if (Test-Path $pngPath) {
  & magick convert $pngPath -define icon:auto-resize=256,64,48,32,16 $icoPath
  Write-Host "Icono generado: $icoPath"
} else {
  Write-Host "ERROR: Coloca un archivo icon.png de 256x256 en $PSScriptRoot"
  exit 1
}
