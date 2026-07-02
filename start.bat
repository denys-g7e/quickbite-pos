@echo off
title QuickBite POS
cd /d "%~dp0"

echo Iniciando QuickBite POS...

if exist "dist\win-unpacked\QuickBite POS.exe" (
    start "" "dist\win-unpacked\QuickBite POS.exe"
    exit /b 0
)

if exist "dist\new-build\QuickBite POS.exe" (
    start "" "dist\new-build\QuickBite POS.exe"
    exit /b 0
)

echo.
echo Version portatil no encontrada.
echo Ejecuta primero build.bat para compilar la app.
echo.
pause
