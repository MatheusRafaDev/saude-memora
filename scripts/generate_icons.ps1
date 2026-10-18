# Wrapper to run the node-based favicon & icon generator
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$mjsPath = Join-Path $scriptDir 'generate_favicons.mjs'

Write-Host "Iniciando geração de favicons e ícones..."
node $mjsPath
Write-Host "Concluído!"
