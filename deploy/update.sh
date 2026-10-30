#!/usr/bin/env bash
# Publishes the latest version from GitHub on the VPS (after deploy/setup-vps.sh has run once).
#   As root on the VPS:  bash /var/www/cybervex/deploy/update.sh
set -euo pipefail

APP_USER="cybervex"
APP_DIR="/var/www/cybervex"

[ "$(id -u)" -eq 0 ] || { echo "Run this as root (sudo -i first)."; exit 1; }
cd "$APP_DIR"

echo "==> Downloading the latest code"
before="$(sudo -u "$APP_USER" git rev-parse HEAD)"
sudo -u "$APP_USER" git pull --ff-only
after="$(sudo -u "$APP_USER" git rev-parse HEAD)"
if [ "$before" = "$after" ] && [ "${1:-}" != "--force" ]; then
  echo "Already up to date ($(git log -1 --format='%h %s')). Use --force to rebuild anyway."
  exit 0
fi
git --no-pager log --oneline "$before..$after" 2>/dev/null || true

echo "==> Installing dependencies and building"
sudo -u "$APP_USER" HOME="/home/$APP_USER" npm ci --no-audit --no-fund
sudo -u "$APP_USER" HOME="/home/$APP_USER" npm run build

echo "==> Restarting the site"
systemctl restart cybervex
for _ in $(seq 1 30); do curl -fs http://127.0.0.1:4000/api/jobs >/dev/null && break; sleep 1; done
if curl -fs http://127.0.0.1:4000/api/jobs >/dev/null; then
  echo "✓ Live: $(git log -1 --format='%h %s')"
else
  echo "! The site did not come back up. Last log lines:"
  journalctl -u cybervex -n 30 --no-pager
  exit 1
fi
