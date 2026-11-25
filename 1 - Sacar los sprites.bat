@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  Sacando todos los sprites del juego como imagenes PNG...
echo.
call npm run sprites:exportar
if not exist "sprites-retocados" mkdir "sprites-retocados"
echo.
echo  Listo. Se abren dos carpetas:
echo    - sprites-editables : todos los sprites (copia de aqui los que quieras cambiar)
echo    - sprites-retocados : pega aqui tus copias y editalas
start "" "%~dp0sprites-editables"
start "" "%~dp0sprites-retocados"
echo.
pause
