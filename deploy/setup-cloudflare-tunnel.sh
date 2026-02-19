#!/usr/bin/env bash
# ─────────────────────────────────────────────
# Survivor Draft — Cloudflare Tunnel Setup
# Run AFTER finish-pi.sh and verifying local access.
# Run as: sudo bash setup-cloudflare-tunnel.sh
# ─────────────────────────────────────────────
set -euo pipefail

echo "════════════════════════════════════════"
echo "  Cloudflare Tunnel Setup"
echo "════════════════════════════════════════"

# ── 1. Install cloudflared ───────────────────
echo ""
echo "[1/4] Installing cloudflared..."
if command -v cloudflared &>/dev/null; then
    echo "  Already installed: $(cloudflared --version)"
else
    # Pi 4 = arm64
    curl -L -o /tmp/cloudflared.deb \
        https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
    dpkg -i /tmp/cloudflared.deb
    rm /tmp/cloudflared.deb
    echo "  Installed: $(cloudflared --version)"
fi

# ── 2. Authenticate ─────────────────────────
echo ""
echo "[2/4] Authenticating with Cloudflare..."
echo "  A browser URL will appear — open it on any device"
echo "  and select the nessvivor.com zone."
echo ""
cloudflared tunnel login

# ── 3. Create tunnel ────────────────────────
echo ""
echo "[3/4] Creating tunnel..."
TUNNEL_NAME="survivor-draft"

# Check if tunnel already exists
if cloudflared tunnel list | grep -q "$TUNNEL_NAME"; then
    echo "  Tunnel '$TUNNEL_NAME' already exists"
    TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
else
    cloudflared tunnel create "$TUNNEL_NAME"
    TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
    echo "  Created tunnel: $TUNNEL_ID"
fi

# ── 4. Write config ─────────────────────────
echo ""
echo "[4/4] Writing tunnel config..."
mkdir -p /etc/cloudflared

cat > /etc/cloudflared/config.yml << CFEOF
tunnel: $TUNNEL_ID
credentials-file: /root/.cloudflared/${TUNNEL_ID}.json

ingress:
  - hostname: nessvivor.com
    service: http://localhost:80
  - hostname: www.nessvivor.com
    service: http://localhost:80
  - service: http_status:404
CFEOF

echo "  ✓ Config written to /etc/cloudflared/config.yml"

# ── 5. DNS routes ───────────────────────────
echo ""
echo "  Setting up DNS routes..."
cloudflared tunnel route dns "$TUNNEL_NAME" nessvivor.com || true
cloudflared tunnel route dns "$TUNNEL_NAME" www.nessvivor.com || true
echo "  ✓ DNS CNAME records created"

# ── 6. Install as system service ────────────
echo ""
echo "  Installing cloudflared as a system service..."
cloudflared service install
systemctl enable cloudflared
systemctl start cloudflared

sleep 3
if systemctl is-active --quiet cloudflared; then
    echo "  ✓ Cloudflare Tunnel running"
else
    echo "  ✗ Tunnel failed to start. Check:"
    echo "    journalctl -u cloudflared -n 20"
    exit 1
fi

echo ""
echo "════════════════════════════════════════"
echo "  ✓ Tunnel Active!"
echo ""
echo "  https://nessvivor.com should now"
echo "  resolve to this Pi."
echo ""
echo "  Logs:    journalctl -u cloudflared -f"
echo "  Status:  cloudflared tunnel info $TUNNEL_NAME"
echo "════════════════════════════════════════"
