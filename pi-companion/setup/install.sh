#!/usr/bin/env bash
# Vibe-Sync Pi Companion — setup script
# Run on a fresh Raspberry Pi OS installation.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Vibe-Sync Pi Companion Setup ==="

# --- Prompt for server URL ---
read -rp "Enter Node.js server URL [http://localhost:3001]: " SERVER_URL
SERVER_URL="${SERVER_URL:-http://localhost:3001}"

# --- Install system dependencies ---
echo "[1/5] Installing system packages..."
sudo apt-get update -qq
sudo apt-get install -y -qq python3-pip chromium-browser

# --- Install Python packages ---
echo "[2/5] Installing Python dependencies..."
cd "$PROJECT_DIR"
pip3 install -r requirements.txt

# --- Create .env file ---
echo "[3/5] Writing .env..."
cat > "$PROJECT_DIR/.env" <<EOF
NODE_SERVER_URL=$SERVER_URL
LED_COUNT=16
LED_PIN=18
LED_BRIGHTNESS=128
EOF
echo "  Created $PROJECT_DIR/.env"

# --- Install and enable systemd service ---
echo "[4/5] Setting up systemd service..."
sudo cp "$SCRIPT_DIR/vibe-sync-leds.service" /etc/systemd/system/
sudo sed -i "s|__PROJECT_DIR__|$PROJECT_DIR|g" /etc/systemd/system/vibe-sync-leds.service
sudo systemctl daemon-reload
sudo systemctl enable vibe-sync-leds.service
echo "  Service enabled (will start on next boot, or run: sudo systemctl start vibe-sync-leds)"

# --- Configure kiosk autostart ---
echo "[5/5] Configuring kiosk autostart..."
AUTOSTART_DIR="$HOME/.config/autostart"
mkdir -p "$AUTOSTART_DIR"

cat > "$AUTOSTART_DIR/vibe-sync-kiosk.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Vibe-Sync Kiosk
Exec=$SCRIPT_DIR/kiosk.sh
X-GNOME-Autostart-enabled=true
EOF

# Write the dashboard URL into kiosk.sh
DASHBOARD_URL="${SERVER_URL%:3001}:3000"
sed -i "s|DASHBOARD_URL=.*|DASHBOARD_URL=\"$DASHBOARD_URL\"|" "$SCRIPT_DIR/kiosk.sh"

echo ""
echo "=== Setup complete! ==="
echo "  LED service:  sudo systemctl start vibe-sync-leds"
echo "  Kiosk:        Will launch on next desktop login"
echo "  Server URL:   $SERVER_URL"
echo "  Dashboard:    $DASHBOARD_URL"
