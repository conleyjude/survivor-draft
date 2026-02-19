# ─────────────────────────────────────────────
# Survivor Draft — Transfer to Pi (run from PC)
# Run from the repo root: .\deploy\transfer-to-pi.ps1
# ─────────────────────────────────────────────

$PI = "pi@192.168.0.71"
$REMOTE_DIR = "/var/www/survivor-draft"

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Transferring files to Pi..." -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# 1. React build output
Write-Host "[1/4] Uploading build/ ..." -ForegroundColor Yellow
scp -r ness-survivor/build/* "${PI}:${REMOTE_DIR}/build/"

# 2. Server files (source only, no node_modules)
Write-Host "[2/4] Uploading server/ ..." -ForegroundColor Yellow
scp server/package.json server/package-lock.json server/index.js server/neo4jConfig.js server/neo4jService.js server/routes.js "${PI}:${REMOTE_DIR}/server/"

# 3. Nginx config
Write-Host "[3/4] Uploading nginx config ..." -ForegroundColor Yellow
scp deploy/survivor-draft.nginx "${PI}:/tmp/"

# 4. Systemd service
Write-Host "[4/4] Uploading systemd service ..." -ForegroundColor Yellow
scp deploy/survivor-draft-api.service "${PI}:/tmp/"

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✓ Transfer complete!" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "  Now SSH into the Pi and run:" -ForegroundColor Green
Write-Host "    ssh ${PI}" -ForegroundColor White
Write-Host "    sudo bash /var/www/survivor-draft/finish-pi.sh" -ForegroundColor White
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
