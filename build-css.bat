@echo off
cd /d "%~dp0"
if not exist "tools\tailwindcss.exe" (
  powershell -ExecutionPolicy Bypass -File "%~dp0build-css.ps1"
  exit /b
)
"tools\tailwindcss.exe" -c tailwind.config.js -i css/input.css -o css/app.css --minify
echo CSS atualizado em css/app.css!
