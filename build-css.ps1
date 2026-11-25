# Gera o CSS final (css/app.css) a partir das classes usadas no HTML/JS.
# Rode este script sempre que mudar classes de estilo no index.html ou nos arquivos .js
# Uso: clique com o botao direito > "Executar com PowerShell"  (ou: .\build-css.ps1)

Set-Location $PSScriptRoot
$cli = Join-Path $PSScriptRoot "tools\tailwindcss.exe"

if (-not (Test-Path $cli)) {
  New-Item -ItemType Directory -Force (Join-Path $PSScriptRoot "tools") | Out-Null
  Write-Host "Baixando Tailwind CLI..."
  $ProgressPreference = 'SilentlyContinue'
  Invoke-WebRequest -Uri "https://github.com/tailwindlabs/tailwindcss/releases/download/v3.4.17/tailwindcss-windows-x64.exe" -OutFile $cli
}

& $cli -c tailwind.config.js -i css/input.css -o css/app.css --minify
Write-Host "CSS gerado em css/app.css"
