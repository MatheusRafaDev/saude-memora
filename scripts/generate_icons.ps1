$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$publicDir = 'c:\Users\rafae\Documents\GitHub\saude-memora\frontend\apps\web\public'
$htmlPath = Join-Path $publicDir 'render-logo.html'

$htmlContent = @"
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; display: flex; align-items: center; justify-content: center; }
  svg { width: 100%; height: 100%; display: block; }
</style>
</head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img">
  <rect width="64" height="64" rx="18" fill="#1D4ED8"/>
  <path d="M11 38 L20 38 L26 20 L32 44 L38 20 L44 38 L50 38" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="54" cy="38" r="3.2" fill="#E8664A"/>
</svg>
</body>
</html>
"@

Set-Content -Path $htmlPath -Value $htmlContent -Encoding utf8

$fileUrl = 'file:///' + ($htmlPath -replace '\\', '/')

$items = @(
  @{ size = 512; name = 'pwa-512x512.png' },
  @{ size = 512; name = 'pwa-maskable-512x512.png' },
  @{ size = 512; name = 'logo.png' },
  @{ size = 192; name = 'pwa-192x192.png' },
  @{ size = 192; name = 'pwa-maskable-192x192.png' },
  @{ size = 180; name = 'apple-touch-icon.png' },
  @{ size = 180; name = 'apple-touch-icon-180x180.png' }
)

foreach ($item in $items) {
  $outPath = Join-Path $publicDir $item.name
  $sz = $item.size
  Start-Process -FilePath $edge -ArgumentList @(
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--default-background-color=00000000',
    "--window-size=$sz,$sz",
    "--screenshot=$outPath",
    $fileUrl
  ) -Wait
  Write-Host "Generated: $($item.name) at ${sz}x${sz}"
}

Remove-Item -Path $htmlPath -Force
Write-Host "All icons generated successfully!"
