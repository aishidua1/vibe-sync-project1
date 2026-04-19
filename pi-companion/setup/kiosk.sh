#!/usr/bin/env bash
# Launches Chromium in kiosk mode pointing at the Vibe-Sync dashboard.
# This script is called by the desktop autostart entry or run manually.
#
# Dashboard URL resolution (in order):
#   1. DASHBOARD_URL environment variable
#   2. DASHBOARD_URL from ~/.vibe-sync-kiosk.env (if present)
#   3. Fallback default below

[ -f "$HOME/.vibe-sync-kiosk.env" ] && source "$HOME/.vibe-sync-kiosk.env"

DASHBOARD_URL="${DASHBOARD_URL:-http://localhost:3000}"

# Disable screen blanking and screensaver
xset s off
xset -dpms
xset s noblank

# Hide cursor after 3 seconds of inactivity (install: sudo apt install unclutter)
if command -v unclutter &>/dev/null; then
  unclutter -idle 3 &
fi

# Wait briefly for the network and dashboard to be reachable
sleep 5

# Launch Chromium in kiosk mode — no UI, fullscreen, no prompts
chromium-browser \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-features=TranslateUI \
  --kiosk "$DASHBOARD_URL" \
  --check-for-update-interval=31536000
