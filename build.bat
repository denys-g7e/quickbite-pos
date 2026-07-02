@echo off
title QuickBite POS - Instalador
cd /d "%~dp0"

echo ========================================
echo  QuickBite POS - Instalacion automatica
echo ========================================
echo.

echo [1/4] Instalando dependencias...
call npm install --ignore-scripts
if %errorlevel% neq 0 (
    echo ERROR: Fallo al instalar dependencias
    pause
    exit /b 1
)

echo [2/4] Compilando frontend...
call npx vite build
if %errorlevel% neq 0 (
    echo ERROR: Fallo al compilar frontend
    pause
    exit /b 1
)

echo [3/4] Compilando backend...
call npx tsc -p electron/tsconfig.json
if %errorlevel% neq 0 (
    echo ERROR: Fallo al compilar backend
    pause
    exit /b 1
)

echo [4/4] Generando ejecutable portatil...
call npx electron-builder --win portable
if %errorlevel% neq 0 (
    echo.
    echo NOTA: El instalador .exe no se genero (permisos).
    echo Pero la version portatil funciona directamente.
    echo.
    echo Para ABRIR la app, usa:  start.bat
) else (
    echo.
    echo INSTALADOR CREADO: dist\QuickBite POS Setup *.exe
)

echo.
echo ========================================
echo  LISTO - Cierra esta ventana y usa start.bat
echo ========================================
pause
