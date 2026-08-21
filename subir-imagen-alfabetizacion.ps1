# subir-imagen-alfabetizacion.ps1
# Uso (una imagen):
#     .\subir-imagen-alfabetizacion.ps1 gato.jpg
# Uso (varias imagenes a la vez):
#     .\subir-imagen-alfabetizacion.ps1 gato.jpg helado.jpg iman.jpg
#
# Igual que subir-imagen-vocabulario.ps1, pero para las imagenes de
# ejemplo de la seccion Alfabetizacion: deben estar dentro de
# img/alfabetizacion/ejemplos/ ANTES de correr este script
# (cópialas ahi a mano primero, como ya vienes haciendo).

param(
    [Parameter(Mandatory=$true, ValueFromRemainingArguments=$true)]
    [string[]]$NombresImagen
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Subir imagen(es) de Alfabetizacion a LSPedia (rama develop)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Verificar que TODOS los archivos existen en img/alfabetizacion/ejemplos/
#    antes de tocar git, para no dejar un commit a medias.
$rutas = @()

foreach ($nombre in $NombresImagen) {
    $ruta = "img/alfabetizacion/ejemplos/$nombre"

    if (-Not (Test-Path $ruta)) {
        Write-Host "ERROR: No se encontró el archivo '$ruta'." -ForegroundColor Red
        Write-Host "Verifica que la imagen esté dentro de img/alfabetizacion/ejemplos/ y que el nombre sea correcto." -ForegroundColor Yellow
        exit 1
    }

    $rutas += $ruta
}

Write-Host "`n[1/5] Cambiando a la rama develop..." -ForegroundColor Green
git checkout develop

Write-Host "`n[2/5] Agregando $($rutas.Count) imagen(es):" -ForegroundColor Green
foreach ($ruta in $rutas) {
    Write-Host "   - $ruta"
    git add $ruta
}

Write-Host "`n[3/5] Creando commit..." -ForegroundColor Green
if ($rutas.Count -eq 1) {
    $mensaje = "Agrega imagen de alfabetizacion $($NombresImagen[0])"
} else {
    $mensaje = "Agrega $($rutas.Count) imagenes de alfabetizacion: $($NombresImagen -join ', ')"
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
    Write-Host " Listo. Imagen(es) de alfabetizacion subida(s) correctamente." -ForegroundColor Cyan
} else {
    Write-Host " No se pudo subir tras varios intentos." -ForegroundColor Red
    Write-Host " Revisa el mensaje de error de arriba (puede haber un" -ForegroundColor Yellow
    Write-Host " conflicto real que necesite resolverse a mano)." -ForegroundColor Yellow
}
Write-Host "==========================================" -ForegroundColor Cyan
