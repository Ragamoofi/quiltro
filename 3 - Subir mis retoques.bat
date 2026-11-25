@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  Revisando tus retoques...
call npm run sprites
if errorlevel 1 (
  echo.
  echo  Hay un problema con algun PNG ^(mira las lineas con X arriba^). No se subio nada.
  pause
  exit /b 1
)
echo.
echo  Subiendo tus retoques a la pagina del juego...
git add "sprites-retocados"
git commit -m "arte: sprites retocados a mano"
git push origin main
echo.
echo  Listo. En unos 2 minutos aparecen en la pagina publicada
echo  (si no los ves, recarga con Ctrl+F5).
pause
