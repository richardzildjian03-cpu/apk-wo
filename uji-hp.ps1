# ============================================================
# Uji di HP + laptop lewat Wi-Fi yang sama (Windows).
#
# Skrip ini:
#   1. Menyalakan tunnel HTTPS (wajib agar kamera HP aktif)
#   2. Menulis APP_URL otomatis ke .env
#   3. Menjalankan ulang server produksi
#   4. Menampilkan alamat untuk laptop & HP
#
# Pakai: klik kanan file ini -> "Run with PowerShell"
#        atau di terminal:  powershell -ExecutionPolicy Bypass -File .\uji-hp.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$cloudflared = "D:\Temp\cloudflared.exe"
if (-not (Test-Path $cloudflared)) {
  Write-Host "cloudflared tidak ditemukan di $cloudflared" -ForegroundColor Red
  Write-Host "Unduh: https://github.com/cloudflare/cloudflared/releases/latest (cloudflared-windows-amd64.exe)" -ForegroundColor Yellow
  exit 1
}

# --- 1. Hentikan tunnel lama (kalau ada) ---
Get-Process -Name cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

$logFile = Join-Path $env:TEMP "cf-uji-out.log"
$errFile = Join-Path $env:TEMP "cf-uji-err.log"
Remove-Item $logFile, $errFile -Force -ErrorAction SilentlyContinue

Write-Host "Menyalakan tunnel HTTPS..." -ForegroundColor Cyan
Start-Process -FilePath $cloudflared `
  -ArgumentList "tunnel", "--url", "http://localhost:3000", "--protocol", "http2", "--no-autoupdate", "--logfile", $logFile `
  -RedirectStandardOutput (Join-Path $env:TEMP "cf-uji-stdout.log") `
  -RedirectStandardError $errFile `
  -WindowStyle Hidden

$url = $null
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 1
  $txt = ""
  foreach ($f in @($logFile, $errFile, (Join-Path $env:TEMP "cf-uji-stdout.log"))) {
    if (Test-Path $f) { $txt += (Get-Content $f -Raw -ErrorAction SilentlyContinue) }
  }
  $m = [regex]::Match($txt, "https://[a-z0-9-]+\.trycloudflare\.com")
  if ($m.Success) { $url = $m.Value; break }
}

if (-not $url) {
  Write-Host "Gagal mendapat URL tunnel. Cek log: $errFile" -ForegroundColor Red
  exit 1
}

# --- 2. Tulis APP_URL ke .env (tanpa BOM) ---
$envPath = Join-Path $root ".env"
$isi = [System.IO.File]::ReadAllText($envPath).TrimStart([char]0xFEFF)
if ($isi -match "(?m)^APP_URL=") {
  $isi = [regex]::Replace($isi, "(?m)^APP_URL=.*$", "APP_URL=`"$url`"")
} else {
  $isi = $isi.TrimEnd() + "`r`nAPP_URL=`"$url`"`r`n"
}
[System.IO.File]::WriteAllText($envPath, $isi, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "APP_URL diset ke: $url" -ForegroundColor Green

# --- 3. Jalankan ulang server produksi ---
Write-Host "Menjalankan ulang server..." -ForegroundColor Cyan
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like "*wo-app*next*" -or $_.CommandLine -like "*npm*run*start*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2

Start-Process -FilePath "npm.cmd" -ArgumentList "run", "start" `
  -RedirectStandardOutput (Join-Path $root "prod-server.log") `
  -RedirectStandardError (Join-Path $root "prod-error.log") `
  -WindowStyle Hidden

# --- 4. Tunggu server siap ---
$lokal = $false
for ($i = 0; $i -lt 40; $i++) {
  Start-Sleep -Seconds 1
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/login" -UseBasicParsing -TimeoutSec 5
    if ($r.StatusCode -eq 200) { $lokal = $true; break }
  } catch { }
}

$ip = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } |
  Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "================ SIAP DIUJI ================" -ForegroundColor Green
Write-Host ("Server lokal : " + $(if ($lokal) { "AKTIF" } else { "BELUM SIAP (cek prod-error.log)" }))
Write-Host ""
Write-Host "LAPTOP  (tanpa kamera):" -ForegroundColor Yellow
Write-Host "  http://localhost:3000"
if ($ip) { Write-Host "  http://${ip}:3000" }
Write-Host ""
Write-Host "HP  (kamera WAJIB lewat HTTPS ini):" -ForegroundColor Yellow
Write-Host "  $url"
Write-Host ""
Write-Host "Login: bos@wo.id / password123"
Write-Host "Undangan contoh:"
Write-Host "  $url/undangan/0f47da3caed1cc741bda"
Write-Host "QR untuk discan (buka di laptop):"
Write-Host "  $url/api/qr/57ad9277f1498cb120c4"
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "PENTING: biarkan jendela ini & proses cloudflared tetap jalan." -ForegroundColor DarkGray
Write-Host "Kalau tunnel dimatikan, URL berubah -> jalankan skrip ini lagi." -ForegroundColor DarkGray
