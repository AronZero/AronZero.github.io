param(
  [string[]]$Paths = @('/'),
  [int]$Height = 6000,
  [switch]$Reduced,
  [switch]$NoBuild,
  [string]$Out = (Join-Path $env:TEMP 'visual-check')
)

# Not 'Stop': Edge writes harmless log lines to stderr, which PowerShell 5.1 would treat as fatal.
$ErrorActionPreference = 'Continue'
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
Set-Location $repo
[IO.Directory]::CreateDirectory($Out) | Out-Null

$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") |
  Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) { throw 'Microsoft Edge not found.' }

if (-not $NoBuild) {
  npm run build | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Build failed: run npm run build to see errors.' }
}

$wrapper = Join-Path $repo 'dist\__mobile.html'
$server = Start-Process -FilePath 'node' -ArgumentList 'node_modules/vite/bin/vite.js', 'preview', '--port', '4173', '--strictPort' -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 3

Add-Type -AssemblyName System.Drawing
function Save-Slices([string]$file, [int]$width, [string]$prefix) {
  $img = [System.Drawing.Image]::FromFile($file)
  $w = [Math]::Min($width, $img.Width)
  $count = [Math]::Ceiling($img.Height / 3000)
  for ($i = 0; $i -lt $count; $i++) {
    $h = [Math]::Min(3000, $img.Height - $i * 3000)
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $w, $h), (New-Object System.Drawing.Rectangle 0, ($i * 3000), $w, $h), [System.Drawing.GraphicsUnit]::Pixel)
    $bmp.Save("$prefix-$i.png"); $g.Dispose(); $bmp.Dispose()
  }
  $img.Dispose()
  [IO.File]::Delete($file)
}

$flags = @('--headless=new', '--disable-gpu', '--hide-scrollbars', '--run-all-compositor-stages-before-draw')
if ($Reduced) { $flags += '--force-prefers-reduced-motion' }

try {
  foreach ($path in $Paths) {
    $name = if ($path -eq '/') { 'home' } else { ($path.Trim('/') -replace '[^a-zA-Z0-9]+', '-') }
    $url = "http://localhost:4173$path"

    $desk = Join-Path $Out "$name-desktop-full.png"
    & $edge @flags "--window-size=1440,$Height" '--virtual-time-budget=8000' "--screenshot=$desk" $url 2>$null | Out-Null
    Save-Slices $desk 1440 (Join-Path $Out "$name-desktop")

    [IO.File]::WriteAllText($wrapper, "<!doctype html><html><body style=`"margin:0;background:#333`"><iframe src=`"$path`" style=`"width:390px;height:${Height}px;border:0;display:block`"></iframe></body></html>")
    $mob = Join-Path $Out "$name-mobile-full.png"
    & $edge @flags "--window-size=800,$Height" '--virtual-time-budget=20000' "--screenshot=$mob" 'http://localhost:4173/__mobile.html' 2>$null | Out-Null
    Save-Slices $mob 390 (Join-Path $Out "$name-mobile")
  }
}
finally {
  Stop-Process -Id $server.Id -ErrorAction SilentlyContinue
  if ([IO.File]::Exists($wrapper)) { [IO.File]::Delete($wrapper) }
}

Get-ChildItem $Out -Filter *.png | Sort-Object Name | ForEach-Object { $_.FullName }
