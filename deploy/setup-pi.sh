#!/usr/bin/env bash
# ─────────────────────────────────────────────
# Survivor Draft — Raspberry Pi Setup Script
# Run as: sudo bash setup-pi.sh
# ─────────────────────────────────────────────
set -euo pipefail

PI_USER="pi"
APP_DIR="/var/www/survivor-draft"

echo "════════════════════════════════════════"
echo "  Survivor Draft — Pi Setup"
echo "════════════════════════════════════════"

# ── 1. System updates ────────────────────────
echo ""
echo "[1/6] Updating system packages..."
apt-get update && apt-get upgrade -y

# ── 2. Install Node.js 18 LTS ───────────────
echo ""
echo "[2/6] Installing Node.js 18..."
if command -v node &>/dev/null; then
    echo "  Node.js already installed: $(node -v)"
else
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    echo "  Installed: $(node -v) / npm $(npm -v)"
fi

# ── 3. Install Nginx ────────────────────────
echo ""
echo "[3/6] Installing Nginx..."
apt-get install -y nginx

# ── 4. Create app directory ──────────────────
echo ""
echo "[4/6] Setting up directory structure..."
mkdir -p "$APP_DIR/build"
mkdir -p "$APP_DIR/server"
chown -R "$PI_USER:$PI_USER" "$APP_DIR"

echo "  Created $APP_DIR"
echo ""
echo "  ┌──────────────────────────────────────────────────┐"
echo "  │  NOW: Transfer files from your PC.               │"
echo "  │                                                    │"
echo "  │  From your PC, run:                               │"
echo "  │    scp -r ness-survivor/build/* \\                 │"
echo "  │        pi@192.168.0.71:$APP_DIR/build/           │"
echo "  │                                                    │"
echo "  │    scp -r server/package.json server/*.js \\       │"
echo "  │        pi@192.168.0.71:$APP_DIR/server/          │"
echo "  │                                                    │"
echo "  │    scp deploy/survivor-draft.nginx \\              │"
echo "  │        pi@192.168.0.71:/tmp/                      │"
echo "  │                                                    │"
echo "  │    scp deploy/survivor-draft-api.service \\        │"
echo "  │        pi@192.168.0.71:/tmp/                      │"
echo "  │                                                    │"
echo "  │  Then come back and run: sudo bash finish-pi.sh   │"
echo "  └──────────────────────────────────────────────────┘"
echo ""
