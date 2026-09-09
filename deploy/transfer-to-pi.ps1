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
Write-Host "[1/4] Uploading React build/ ..." -ForegroundColor Yellow
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
Write-Host "[2/4] Uploading server/ ..." -ForegroundColor Yellow
$serverFiles = @(
    "$ROOT\server\package.json",
    "$ROOT\server\package-lock.json",
    "$ROOT\server\index.js",
    "$ROOT\server\neo4jConfig.js",
    "$ROOT\server\neo4jService.js",
    "$ROOT\server\routes.js",
    "$ROOT\server\socket.js"
)
scp @SSH_OPT @serverFiles "${PI}:${REMOTE}/server/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR uploading server files" -ForegroundColor Red
    exit 1
}

# 3. Nginx config - refresh in case routes (e.g. /socket.io/) changed
Write-Host "[3/4] Updating Nginx config ..." -ForegroundColor Yellow
scp @SSH_OPT "$ROOT\deploy\survivor-draft.nginx" "${PI}:/tmp/survivor-draft.nginx"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR uploading nginx config" -ForegroundColor Red
    exit 1
}
ssh @SSH_OPT $PI "sudo cp /tmp/survivor-draft.nginx /etc/nginx/sites-available/survivor-draft && sudo nginx -t && sudo systemctl reload nginx"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR applying nginx config" -ForegroundColor Red
    exit 1
}

# 4. Restart the API service on the Pi
Write-Host "[4/4] Restarting API service on Pi ..." -ForegroundColor Yellow
ssh @SSH_OPT $PI "cd $REMOTE/server && npm install --production --silent && sudo systemctl restart survivor-draft-api"
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: service restart may have failed - check Pi logs" -ForegroundColor Yellow
}

# Verify the service actually stayed up (exit code 1 = crash-looped)
Write-Host "Verifying service health ..." -ForegroundColor Yellow
ssh @SSH_OPT $PI "sleep 4 && systemctl is-active --quiet survivor-draft-api"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: survivor-draft-api is not running after restart. Recent logs:" -ForegroundColor Red
    ssh @SSH_OPT $PI "journalctl -u survivor-draft-api -n 30 --no-pager"
    exit 1
}

Write-Host ""
Write-Host "Done! Site: https://surviveness.com" -ForegroundColor Green
Write-Host ""
