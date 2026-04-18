#!/usr/bin/env bash
# Launches Chromium in kiosk mode pointing at the Vibe-Sync dashboard.
# This script is called by the desktop autostart entry or run manually.

DASHBOARD_URL="http://10.197.86.221:3000"

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
