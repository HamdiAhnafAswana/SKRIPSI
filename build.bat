@echo off
REM Klik dua kali file ini untuk menggabungkan src\ menjadi dist\netcrimp2.html
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js tidak ditemukan. Jalankan:  npm i -g node  ^(atau unduh dari nodejs.org^)
  echo.
  pause
  exit /b 1
)
node build.mjs
echo.
pause