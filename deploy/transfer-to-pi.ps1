# Survivor Draft - Transfer to Pi
# Can be run from any directory

$PI      = "ubuntu@192.168.0.71"
$REMOTE  = "/var/www/survivor-draft"
$ROOT    = "$PSScriptRoot\.."
$SSH_OPT = @("-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=10")

Write-Host ""
Write-Host "--- Survivor Draft: Deploying to Pi ---" -ForegroundColor Cyan
Write-Host ""

# 1. React build - scp the directory, then move into place on Pi
Write-Host "[1/3] Uploading React build/ ..." -ForegroundColor Yellow
$buildDir = (Resolve-Path "$ROOT\ness-survivor\build").Path
scp @SSH_OPT -r "$buildDir" "${PI}:/tmp/sdraft-build"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR uploading build" -ForegroundColor Red
    exit 1
}
ssh @SSH_OPT $PI "rm -rf $REMOTE/build/* && cp -r /tmp/sdraft-build/. $REMOTE/build/ && rm -rf /tmp/sdraft-build && chmod -R 755 $REMOTE/build"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR installing build on Pi" -ForegroundColor Red
    exit 1
}
$zipPath = "$env:TEMP\survivor-build.zip"
Remove-Item $zipPath -ErrorAction SilentlyContinue

# 2. Server source files
Write-Host "[2/3] Uploading server/ ..." -ForegroundColor Yellow
$serverFiles = @(
    "$ROOT\server\package.json",
    "$ROOT\server\package-lock.json",
    "$ROOT\server\index.js",
    "$ROOT\server\neo4jConfig.js",
    "$ROOT\server\neo4jService.js",
    "$ROOT\server\routes.js"
)
scp @SSH_OPT @serverFiles "${PI}:${REMOTE}/server/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR uploading server files" -ForegroundColor Red
    exit 1
}

# 3. Restart the API service on the Pi
Write-Host "[3/3] Restarting API service on Pi ..." -ForegroundColor Yellow
ssh @SSH_OPT $PI "cd $REMOTE/server && npm install --production --silent && sudo systemctl restart survivor-draft-api"
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: service restart may have failed - check Pi logs" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done! Site: https://surviveness.com" -ForegroundColor Green
Write-Host ""
