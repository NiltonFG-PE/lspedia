@echo off
setlocal
cd /d "%~dp0"

echo ==============================================
echo   LSPedia - Actualizar vocabulario desde Hoja 2
echo ==============================================
echo.

where python >nul 2>nul
if errorlevel 1 (
  echo ERROR: Python no esta instalado o no esta en PATH.
  echo Instala Python y vuelve a intentarlo.
  pause
  exit /b 1
)

python scripts\generar_vocabulario.py
if errorlevel 1 (
  echo.
  echo No se pudo actualizar vocabulario.json.
  pause
  exit /b 1
)

echo.
echo Actualizacion terminada correctamente.
pause
