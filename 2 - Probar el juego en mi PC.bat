@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  Abriendo el juego en tu PC con tus retoques...
echo  Deja esta ventana abierta mientras pruebas. Cada vez que guardes un PNG
echo  en sprites-retocados el juego se recarga solo.
echo  Para terminar, cierra esta ventana.
echo.
start "" cmd /c "timeout /t 6 >/dev/null & start http://localhost:5173/ & start http://localhost:5173/sprites.html"
call npm run dev
