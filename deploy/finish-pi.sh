#!/usr/bin/env bash
# ─────────────────────────────────────────────
# Survivor Draft — Finish Pi Setup
# Run AFTER transferring files from PC.
# Run as: sudo bash finish-pi.sh
# ─────────────────────────────────────────────
set -euo pipefail

PI_USER="ubuntu"
APP_DIR="/var/www/survivor-draft"

echo "════════════════════════════════════════"
echo "  Survivor Draft — Finishing Setup"
echo "════════════════════════════════════════"

# ── 1. Verify files were transferred ────────
echo ""
echo "[1/6] Verifying transferred files..."
if [ ! -f "$APP_DIR/build/index.html" ]; then
    echo "  ✗ ERROR: build/index.html not found. Did you SCP the build folder?"
    exit 1
fi
if [ ! -f "$APP_DIR/server/index.js" ]; then
    echo "  ✗ ERROR: server/index.js not found. Did you SCP the server folder?"
    exit 1
fi
echo "  ✓ Files found"

# ── 2. Install server dependencies ──────────
echo ""
echo "[2/6] Installing server dependencies..."
cd "$APP_DIR/server"
sudo -u "$PI_USER" npm install --production
echo "  ✓ Dependencies installed"

# ── 3. Create .env if it doesn't exist ──────
echo ""
echo "[3/6] Checking .env file..."
if [ ! -f "$APP_DIR/server/.env" ]; then
    cat > "$APP_DIR/server/.env" << 'ENVEOF'
# Neo4j Aura credentials
NEO4J_URI=neo4j+s://eaea5e82.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=CHANGE_ME

# Server config
PORT=4000
CORS_ORIGIN=https://surviveness.com
ENVEOF
    chown "$PI_USER:$PI_USER" "$APP_DIR/server/.env"
    chmod 600 "$APP_DIR/server/.env"
    echo "  ✓ Created .env (edit the password!)"
    echo ""
    echo "  ┌──────────────────────────────────────────────────┐"
    echo "  │  IMPORTANT: Edit the Neo4j password now:         │"
    echo "  │    nano $APP_DIR/server/.env                     │"
    echo "  │  Then re-run this script.                        │"
    echo "  └──────────────────────────────────────────────────┘"
    echo ""
    read -p "  Press Enter after editing .env, or Ctrl+C to exit..."
fi

# Verify password was changed
if grep -q "CHANGE_ME" "$APP_DIR/server/.env"; then
    echo "  ✗ ERROR: You still need to set your Neo4j password in .env"
    echo "    nano $APP_DIR/server/.env"
    exit 1
fi
echo "  ✓ .env configured"

# ── 4. Install Nginx config ─────────────────
echo ""
echo "[4/6] Configuring Nginx..."
cp /tmp/survivor-draft.nginx /etc/nginx/sites-available/survivor-draft
ln -sf /etc/nginx/sites-available/survivor-draft /etc/nginx/sites-enabled/survivor-draft
rm -f /etc/nginx/sites-enabled/default

# Test config
nginx -t
systemctl restart nginx
systemctl enable nginx
echo "  ✓ Nginx configured and running"

# ── 5. Install and start API service ────────
echo ""
echo "[5/6] Setting up Express API service..."
cp /tmp/survivor-draft-api.service /etc/systemd/system/survivor-draft-api.service
systemctl daemon-reload
systemctl enable survivor-draft-api
systemctl start survivor-draft-api

# Wait a moment and check status
sleep 2
if systemctl is-active --quiet survivor-draft-api; then
    echo "  ✓ API service running"
else
    echo "  ✗ API service failed to start. Check logs:"
    echo "    journalctl -u survivor-draft-api -n 20"
    exit 1
fi

# ── 6. Verify everything ────────────────────
echo ""
echo "[6/6] Verifying deployment..."

# Test API health
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health 2>/dev/null || echo "000")
if [ "$API_STATUS" = "200" ]; then
    echo "  ✓ API health check passed (port 4000)"
else
    echo "  ✗ API health check failed (HTTP $API_STATUS)"
fi

# Test Nginx
NGINX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
if [ "$NGINX_STATUS" = "200" ]; then
    echo "  ✓ Nginx serving frontend (port 80)"
else
    echo "  ✗ Nginx check failed (HTTP $NGINX_STATUS)"
fi

# Test API through Nginx
PROXY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/seasons 2>/dev/null || echo "000")
if [ "$PROXY_STATUS" = "200" ]; then
    echo "  ✓ Nginx→API proxy working"
else
    echo "  ⚠ API proxy returned HTTP $PROXY_STATUS (may be OK if no seasons exist yet)"
fi

echo ""
echo "════════════════════════════════════════"
echo "  ✓ Deployment Complete!"
echo ""
echo "  Local:    http://192.168.0.71"
echo "  Logs:     journalctl -u survivor-draft-api -f"
echo "  Restart:  sudo systemctl restart survivor-draft-api"
echo ""
echo "  Next: Set up Cloudflare Tunnel for"
echo "        https://nessvivor.com"
echo "════════════════════════════════════════"
