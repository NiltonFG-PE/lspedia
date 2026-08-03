# subir-imagen.ps1
# Uso: .\subir-imagen.ps1 nombre-de-la-imagen.png

param(
    [Parameter(Mandatory=$true)]
    [string]$NombreImagen
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Subir imagen a LSPedia (rama develop)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Verificar que el archivo existe en img/diccionario/
$rutaImagen = "img/diccionario/$NombreImagen"

if (-Not (Test-Path $rutaImagen)) {
    Write-Host "ERROR: No se encontró el archivo '$rutaImagen'." -ForegroundColor Red
    Write-Host "Verifica que la imagen esté dentro de la carpeta img/diccionario/ y que el nombre sea correcto." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n[1/5] Cambiando a la rama develop..." -ForegroundColor Green
git checkout develop

Write-Host "`n[2/5] Agregando la imagen: $rutaImagen" -ForegroundColor Green
git add $rutaImagen

Write-Host "`n[3/5] Creando commit..." -ForegroundColor Green
$mensaje = "Agrega imagen $NombreImagen"
git commit -m "$mensaje"

Write-Host "`n[4/5] Trayendo cambios remotos (git pull)..." -ForegroundColor Green
git pull origin develop

Write-Host "`n[5/5] Subiendo cambios (git push)..." -ForegroundColor Green

# El push puede fallar si, entre el pull de arriba y este momento, alguien
# (u otra sesion/dispositivo tuyo) subio algo nuevo al remoto. En vez de
# dejarte el error a medias, reintentamos automaticamente: si el primer
# push falla, hacemos otro pull y probamos de nuevo, hasta 3 intentos.
$intentoMaximo = 3
$subidoOk = $false

for ($intento = 1; $intento -le $intentoMaximo; $intento++) {

    git push origin develop
    if ($LASTEXITCODE -eq 0) {
        $subidoOk = $true
        break
    }

    if ($intento -lt $intentoMaximo) {
        Write-Host "`nEl push fue rechazado (el remoto tiene cambios nuevos)." -ForegroundColor Yellow
        Write-Host "Reintentando: trayendo cambios de nuevo (intento $intento de $intentoMaximo)..." -ForegroundColor Yellow
        git pull origin develop
    }
}

Write-Host "`n==========================================" -ForegroundColor Cyan
if ($subidoOk) {
    Write-Host " Listo. Imagen subida correctamente." -ForegroundColor Cyan
} else {
    Write-Host " No se pudo subir tras varios intentos." -ForegroundColor Red
    Write-Host " Revisa el mensaje de error de arriba (puede haber un" -ForegroundColor Yellow
    Write-Host " conflicto real que necesite resolverse a mano)." -ForegroundColor Yellow
}
Write-Host "==========================================" -ForegroundColor Cyan