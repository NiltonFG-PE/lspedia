# subir-imagen-vocabulario.ps1
# Uso: .\subir-imagen-vocabulario.ps1 nombre-de-la-imagen.png
#      .\subir-imagen-vocabulario.ps1 lunes.png,martes.png,miercoles.png
#
# Igual que subir-imagen.ps1 (diccionario), pero para las imágenes de la
# sección Vocabulario: las imágenes deben estar dentro de img/vocabulario/
# ANTES de correr este script (cópialas ahí a mano primero).
#
# NOVEDAD: si le pasas un .png (o .jpg/.jpeg), el script lo convierte
# automaticamente a .webp antes de subirlo (pesa menos, carga mas rapido).
# El archivo que queda en el repo y el que se sube a GitHub es el .webp;
# el .png/.jpg original se borra de tu carpeta local.
# Si le pasas directamente un .webp, lo sube tal cual, sin tocarlo.

param(
    [Parameter(Mandatory=$true)]
    [string[]]$NombreImagen,

    [int]$Calidad = 82
)

$ErrorActionPreference = "Stop"
# Evita que un comando externo (cwebp, magick, python) que devuelva un
# codigo de salida distinto de 0 tumbe todo el script como si fuera un
# error de PowerShell. Usamos $LASTEXITCODE a mano en su lugar.
$PSNativeCommandUseErrorActionPreference = $false

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Subir imagen(es) de Vocabulario a LSPedia (rama develop)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# ---------------------------------------------------------
# 0. Detectar herramienta de conversion a WebP (solo se usa
#    si alguna imagen viene en .png/.jpg/.jpeg)
# ---------------------------------------------------------
function Test-PythonReal {
    # Windows trae un "python.exe" falso en WindowsApps que solo abre la
    # Microsoft Store. Get-Command lo encuentra igual, asi que lo filtramos.
    $cmd = Get-Command python -ErrorAction SilentlyContinue
    if (-not $cmd) { return $false }
    if ($cmd.Source -like "*WindowsApps*") { return $false }

    python -c "import PIL" *> $null
    return ($LASTEXITCODE -eq 0)
}

function Get-HerramientaConversion {
    if (Get-Command magick -ErrorAction SilentlyContinue) { return "magick" }
    if (Get-Command cwebp -ErrorAction SilentlyContinue) { return "cwebp" }
    if (Test-PythonReal) { return "python" }
    return $null
}

function Convert-ImagenAWebp($rutaOrigen, $calidad, $herramienta) {
    $rutaWebp = [System.IO.Path]::ChangeExtension($rutaOrigen, "webp")
    switch ($herramienta) {
        "magick" { magick "$rutaOrigen" -quality $calidad "$rutaWebp" }
        "cwebp"  { cwebp -q $calidad "$rutaOrigen" -o "$rutaWebp" | Out-Null }
        "python" {
            python -c "from PIL import Image; im = Image.open(r'$rutaOrigen'); im.convert('RGB' if im.mode not in ('RGBA','LA') else 'RGBA').save(r'$rutaWebp', 'WEBP', quality=$calidad, method=6)"
        }
    }
    return $rutaWebp
}

# 1. Verificar que todos los archivos existen en img/vocabulario/,
#    y convertir a webp los que vengan en png/jpg/jpeg.
$rutasImagenes = @()
$herramienta = $null

foreach ($nombre in $NombreImagen) {
    $ruta = "img/vocabulario/$nombre"
    if (-Not (Test-Path $ruta)) {
        Write-Host "ERROR: No se encontró el archivo '$ruta'." -ForegroundColor Red
        Write-Host "Verifica que la imagen esté dentro de la carpeta img/vocabulario/ y que el nombre sea correcto." -ForegroundColor Yellow
        exit 1
    }

    $extension = [System.IO.Path]::GetExtension($ruta).ToLower()
    if ($extension -in @(".png", ".jpg", ".jpeg")) {
        if (-not $herramienta) {
            $herramienta = Get-HerramientaConversion
            if (-not $herramienta) {
                Write-Host "`nERROR: '$nombre' esta en $extension y no encontre ninguna herramienta para convertir a WebP." -ForegroundColor Red
                Write-Host "Instala una de estas opciones:" -ForegroundColor Yellow
                Write-Host "  - cwebp: https://developers.google.com/speed/webp/download" -ForegroundColor Yellow
                Write-Host "  - ImageMagick: https://imagemagick.org/script/download.php#windows" -ForegroundColor Yellow
                Write-Host "  - Python + Pillow: pip install Pillow" -ForegroundColor Yellow
                Write-Host "O sube directamente un archivo .webp si ya lo tienes convertido." -ForegroundColor Yellow
                exit 1
            }
            Write-Host "`nHerramienta de conversion detectada: $herramienta" -ForegroundColor Green
        }

        Write-Host "Convirtiendo $nombre a WebP..." -ForegroundColor Green
        $rutaWebp = Convert-ImagenAWebp $ruta $Calidad $herramienta
        if (-Not (Test-Path $rutaWebp)) {
            Write-Host "ERROR: no se pudo convertir '$nombre' a WebP." -ForegroundColor Red
            exit 1
        }
        Remove-Item $ruta -Force
        $ruta = $rutaWebp
        Write-Host "   -> $([System.IO.Path]::GetFileName($ruta))" -ForegroundColor Green
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
    $mensaje = "Agrega imagen de vocabulario $($nombresFinales[0])"
} else {
    $mensaje = "Agrega imagenes de vocabulario: $($nombresFinales -join ', ')"
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
    Write-Host " Listo. Imagen de vocabulario subida correctamente." -ForegroundColor Cyan
    Write-Host " Recuerda: en tu Google Sheet, la URL de la columna 'imagen'" -ForegroundColor Cyan
    Write-Host " debe terminar en .webp para esta palabra." -ForegroundColor Cyan
} else {
    Write-Host " No se pudo subir tras varios intentos." -ForegroundColor Red
    Write-Host " Revisa el mensaje de error de arriba (puede haber un" -ForegroundColor Yellow
    Write-Host " conflicto real que necesite resolverse a mano)." -ForegroundColor Yellow
}
Write-Host "==========================================" -ForegroundColor Cyan