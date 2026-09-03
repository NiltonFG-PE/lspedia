# subir-imagen-diccionario.ps1
# Uso: .\subir-imagen-diccionario.ps1 nombre-de-la-imagen.webp
#      .\subir-imagen-diccionario.ps1 hola.webp,gracias.webp,"de nada.webp"
#
# NOVEDAD: ahora acepta una o varias imagenes separadas por coma en un
# solo comando (antes solo aceptaba una imagen por ejecucion).
# Los nombres con espacios deben ir entre comillas, ej: "buenas tardes.webp"

param(
    [Parameter(Mandatory=$true)]
    [string[]]$NombreImagen
)

$ErrorActionPreference = "Stop"
# Evita que un comando externo (git) que devuelva un codigo de salida
# distinto de 0 tumbe todo el script como si fuera un error de PowerShell.
# Usamos $LASTEXITCODE a mano en su lugar.
$PSNativeCommandUseErrorActionPreference = $false

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Subir imagen(es) de Diccionario a LSPedia (rama develop)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Verificar que todos los archivos existen en img/diccionario/
$rutasImagenes = @()

foreach ($nombre in $NombreImagen) {
    $ruta = "img/diccionario/$nombre"
    if (-Not (Test-Path $ruta)) {
        Write-Host "ERROR: No se encontró el archivo '$ruta'." -ForegroundColor Red
        Write-Host "Verifica que la imagen esté dentro de la carpeta img/diccionario/ y que el nombre sea correcto." -ForegroundColor Yellow
        exit 1
    }
    $rutasImagenes += $ruta
}

Write-Host "`n[1/5] Cambiando a la rama develop..." -ForegroundColor Green
git checkout develop

Write-Host "`n[2/5] Agregando $($rutasImagenes.Count) imagen(es):" -ForegroundColor Green
foreach ($ruta in $rutasImagenes) {
    Write-Host "   - $ruta" -ForegroundColor Green
    git add $ruta
}

Write-Host "`n[3/5] Creando commit..." -ForegroundColor Green
$nombresFinales = $rutasImagenes | ForEach-Object { [System.IO.Path]::GetFileName($_) }
if ($nombresFinales.Count -eq 1) {
    $mensaje = "Agrega imagen $($nombresFinales[0])"
} else {
    $mensaje = "Agrega imagenes: $($nombresFinales -join ', ')"
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
    Write-Host " Listo. Imagen(es) subida(s) correctamente." -ForegroundColor Cyan
} else {
    Write-Host " No se pudo subir tras varios intentos." -ForegroundColor Red
    Write-Host " Revisa el mensaje de error de arriba (puede haber un" -ForegroundColor Yellow
    Write-Host " conflicto real que necesite resolverse a mano)." -ForegroundColor Yellow
}
Write-Host "==========================================" -ForegroundColor Cyan