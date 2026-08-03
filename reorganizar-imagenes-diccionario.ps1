# reorganizar-imagenes-diccionario.ps1
# Uso: .\reorganizar-imagenes-diccionario.ps1
#
# Script de UNA SOLA VEZ: mueve todas las imágenes de palabras del
# diccionario que están sueltas en img/ hacia img/diccionario/, usando
# "git mv" (así se conserva el historial de cada archivo en git, no se
# borra nada, solo se reubica).
#
# NO toca:
#   - img/favicon.png, img/lspedia.png, img/avatar_sin_fondo.png,
#     img/qr-binance.jpg, img/qr-paypal.png, img/qr-yape.jpg
#   - lo que ya está dentro de subcarpetas (img/icons/, img/categorias/,
#     img/vocabulario/, img/diccionario/)
#
# IMPORTANTE: después de correr este script, todavía falta el Paso 2
# (actualizar las URLs guardadas en la columna "imagen" de tu Hoja 1 de
# Google Sheets) para que las imágenes se sigan viendo en el sitio.

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Reorganizar imagenes del Diccionario a img/diccionario/" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Archivos que deben quedarse en img/ tal cual (assets del sitio, no
# imagenes de palabras).
$excluir = @("favicon.png", "lspedia.png", "avatar_sin_fondo.png", "qr-binance.jpg", "qr-paypal.png", "qr-yape.jpg")

Write-Host "`n[1/4] Cambiando a la rama develop..." -ForegroundColor Green
git checkout develop
git pull origin develop

Write-Host "`n[2/4] Creando la carpeta img/diccionario/ (si no existe)..." -ForegroundColor Green
if (-Not (Test-Path "img/diccionario")) {
    New-Item -ItemType Directory -Path "img/diccionario" | Out-Null
}

Write-Host "`n[3/4] Moviendo imagenes sueltas de img/ a img/diccionario/..." -ForegroundColor Green

# Solo archivos que estan DIRECTAMENTE en img/ (no en subcarpetas como
# icons/, categorias/, vocabulario/, diccionario/), y que no esten en la
# lista de exclusion.
$archivos = Get-ChildItem -Path "img" -File | Where-Object { $excluir -notcontains $_.Name }

if ($archivos.Count -eq 0) {
    Write-Host "No encontre imagenes sueltas en img/ para mover. ¿Ya se habian movido?" -ForegroundColor Yellow
} else {
    foreach ($archivo in $archivos) {
        $origen = "img/$($archivo.Name)"
        $destino = "img/diccionario/$($archivo.Name)"
        Write-Host "  Moviendo: $origen  ->  $destino"
        git mv $origen $destino
    }

    Write-Host "`n[4/4] Creando commit y subiendo a GitHub..." -ForegroundColor Green
    git commit -m "Reorganiza imagenes del diccionario a img/diccionario/"
    git push origin develop
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host " Listo. Archivos movidos y subidos." -ForegroundColor Cyan
Write-Host " AHORA FALTA EL PASO 2: actualizar las URLs en tu Hoja 1" -ForegroundColor Yellow
Write-Host " de Google Sheets (columna 'imagen'). Ver instrucciones." -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan