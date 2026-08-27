# subir-fonetica-alfabetizacion.ps1
# Uso: .\subir-fonetica-alfabetizacion.ps1 C.webm
#      .\subir-fonetica-alfabetizacion.ps1 C.webm,D.webm,E.png
#
# Igual que subir-imagen-vocabulario.ps1, pero para los archivos de la
# seccion Fonetica (boca) de Alfabetizacion: pueden ser imagen (.png/.jpg)
# o video con fondo transparente (.webm/.mp4). Los archivos deben estar
# dentro de img/alfabetizacion/boca/ ANTES de correr este script (copialos
# ahi a mano primero).

param(
    [Parameter(Mandatory=$true)]
    [string[]]$NombreArchivo
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Subir fonetica (boca) de Alfabetizacion a LSPedia (rama develop)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Verificar que todos los archivos existen en img/alfabetizacion/boca/
$rutasArchivos = @()
foreach ($nombre in $NombreArchivo) {
    $ruta = "img/alfabetizacion/boca/$nombre"
    if (-Not (Test-Path $ruta)) {
        Write-Host "ERROR: No se encontró el archivo '$ruta'." -ForegroundColor Red
        Write-Host "Verifica que el archivo esté dentro de la carpeta img/alfabetizacion/boca/ y que el nombre sea correcto." -ForegroundColor Yellow
        exit 1
    }
    $rutasArchivos += $ruta
}

Write-Host "`n[1/5] Cambiando a la rama develop..." -ForegroundColor Green
git checkout develop

Write-Host "`n[2/5] Agregando $($rutasArchivos.Count) archivo(s):" -ForegroundColor Green
foreach ($ruta in $rutasArchivos) {
    Write-Host "   - $ruta" -ForegroundColor Green
    git add $ruta
}

Write-Host "`n[3/5] Creando commit..." -ForegroundColor Green
if ($NombreArchivo.Count -eq 1) {
    $mensaje = "Agrega fonetica (boca) $($NombreArchivo[0])"
} else {
    $mensaje = "Agrega fonetica (boca): $($NombreArchivo -join ', ')"
}
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
    Write-Host " Listo. Fonetica (boca) subida correctamente." -ForegroundColor Cyan
    Write-Host " Recuerda actualizar el campo 'imagenBoca' en el Google Sheet" -ForegroundColor Yellow
    Write-Host " de cada letra/numero que hayas subido, para que apunte al" -ForegroundColor Yellow
    Write-Host " archivo nuevo (ej. img/alfabetizacion/boca/C.webm)." -ForegroundColor Yellow
} else {
    Write-Host " No se pudo subir tras varios intentos." -ForegroundColor Red
    Write-Host " Revisa el mensaje de error de arriba (puede haber un" -ForegroundColor Yellow
    Write-Host " conflicto real que necesite resolverse a mano)." -ForegroundColor Yellow
}
Write-Host "==========================================" -ForegroundColor Cyan
