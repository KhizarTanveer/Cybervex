#!/usr/bin/env bash
# Sets a new admin panel password on the VPS (stored only as a hash) and signs out every admin session.
#   As root on the VPS:  bash /var/www/cybervex/deploy/set-admin-password.sh
set -euo pipefail

APP_USER="cybervex"
APP_DIR="/var/www/cybervex"
ENV_FILE="$APP_DIR/server/.env"

[ "$(id -u)" -eq 0 ] || { echo "Run this as root (sudo -i first)."; exit 1; }
[ -f "$ENV_FILE" ] || { echo "$ENV_FILE not found — run deploy/setup-vps.sh first."; exit 1; }

while true; do
  read -r -s -p "New admin password (at least 12 characters): " a; echo
  read -r -s -p "Type it again: " b; echo
  if [ "$a" != "$b" ]; then echo "They don't match — try again."; continue; fi
  if [ "${#a}" -lt 12 ]; then echo "Use at least 12 characters."; continue; fi
  break
done

hash="$(printf '%s\n' "$a" | sudo -u "$APP_USER" node "$APP_DIR/server/hash-password.js" | grep '^ADMIN_PASSWORD_HASH=' | cut -d= -f2-)"
unset a b
[ -n "$hash" ] || { echo "Could not create the password hash."; exit 1; }

# The hash is base64 (no "|"), so "|" is a safe sed delimiter
sed -i "s|^ADMIN_PASSWORD_HASH=.*|ADMIN_PASSWORD_HASH=$hash|" "$ENV_FILE"
systemctl restart cybervex
echo "✓ Admin password changed. Sign in at /admin with the new password."
