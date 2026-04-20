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

# Wait for the dashboard to actually answer on localhost:3000 so the kiosk
# doesn't race ahead and land on an error/Spectrum page if npm start is slow.
for i in $(seq 1 30); do
  if curl -s --max-time 1 "$DASHBOARD_URL" >/dev/null; then
    break
  fi
  sleep 1
done

# Use a throwaway profile so Chromium doesn't restore stale tabs from earlier
# sessions (which can resolve to wrong URLs and trigger ISP block pages).
PROFILE_DIR="/tmp/vibe-sync-kiosk-profile-$$"
rm -rf "$PROFILE_DIR"

# Launch Chromium in kiosk mode — no UI, fullscreen, no prompts, fresh profile
chromium-browser \
  --user-data-dir="$PROFILE_DIR" \
  --no-first-run \
  --no-default-browser-check \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --noerrdialogs \
  --disable-infobars \
  --disable-features=TranslateUI \
  --kiosk "$DASHBOARD_URL" \
  --check-for-update-interval=31536000
