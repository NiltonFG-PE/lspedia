# eliminar-imagenes-antiguas.ps1
# Elimina del repo las imagenes .png/.jpg/.jpeg de una carpeta que ya
# tiene su version .webp equivalente (es decir, limpia los formatos
# viejos despues de migrar a webp).
#
# Uso:
#     .\eliminar-imagenes-antiguas.ps1 img/diccionario
#     .\eliminar-imagenes-antiguas.ps1 img/vocabulario
#     .\eliminar-imagenes-antiguas.ps1 img/alfabetizacion/ejemplos
#
# Solo borra archivos que tengan un .webp con el mismo nombre en la
# misma carpeta, para evitar borrar por error una imagen que todavia
# no fue migrada.

param(
    [Parameter(Mandatory=$true)]
    [string]$Carpeta
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Eliminar imagenes antiguas (png/jpg/jpeg) - $Carpeta" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "`n[1/6] Cambiando a la rama develop..." -ForegroundColor Green
git checkout develop

if (-Not (Test-Path $Carpeta)) {
    Write-Host "ERROR: No se encontró la carpeta '$Carpeta'." -ForegroundColor Red
    exit 1
}

# 1. Buscar archivos png/jpg/jpeg que tengan su .webp equivalente
$candidatos = Get-ChildItem -Path $Carpeta -File | Where-Object {
    $_.Extension -in @(".png", ".jpg", ".jpeg")
}

$aEliminar = @()
foreach ($archivo in $candidatos) {
    $webpEquivalente = Join-Path $Carpeta ([System.IO.Path]::GetFileNameWithoutExtension($archivo.Name) + ".webp")
    if (Test-Path $webpEquivalente) {
        $aEliminar += $archivo.FullName
    } else {
        Write-Host "AVISO: '$($archivo.Name)' no tiene un .webp equivalente, se deja intacto." -ForegroundColor Yellow
    }
}

if ($aEliminar.Count -eq 0) {
    Write-Host "`nNo hay nada que eliminar (ninguna imagen antigua tiene su .webp equivalente)." -ForegroundColor Yellow
    exit 0
}

Write-Host "`nSe eliminarán $($aEliminar.Count) archivo(s):" -ForegroundColor Green
foreach ($ruta in $aEliminar) {
    Write-Host "   - $ruta"
}

$confirmacion = Read-Host "`n¿Confirmas? (s/n)"
if ($confirmacion -ne "s") {
    Write-Host "Cancelado." -ForegroundColor Yellow
    exit 0
}

Write-Host "`n[2/6] Eliminando archivos del repo (git rm)..." -ForegroundColor Green
foreach ($ruta in $aEliminar) {
    git rm $ruta
}

Write-Host "`n[3/6] Creando commit..." -ForegroundColor Green
$nombresFinales = $aEliminar | ForEach-Object { [System.IO.Path]::GetFileName($_) }
$mensaje = "Elimina $($nombresFinales.Count) imagen(es) antigua(s) ya migradas a webp en $Carpeta"
git commit -m "$mensaje"

Write-Host "`n[4/6] Trayendo cambios remotos (git pull)..." -ForegroundColor Green
git pull origin develop

Write-Host "`n[5/6] Subiendo cambios (git push)..." -ForegroundColor Green

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
    Write-Host " Listo. Imagenes antiguas eliminadas correctamente." -ForegroundColor Cyan
} else {
    Write-Host " No se pudo subir tras varios intentos." -ForegroundColor Red
    Write-Host " Revisa el mensaje de error de arriba (puede haber un" -ForegroundColor Yellow
    Write-Host " conflicto real que necesite resolverse a mano)." -ForegroundColor Yellow
}
Write-Host "==========================================" -ForegroundColor Cyan