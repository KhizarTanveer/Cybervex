#!/usr/bin/env bash
# Authorises the GitHub Actions deploy key on the VPS, restricted to running the site update only.
#   From your PC (PowerShell):
#     Get-Content $HOME\.ssh\cybervex_github_deploy.pub | ssh root@VPS_IP bash /var/www/cybervex/deploy/add-github-deploy-key.sh
# The key can then run /usr/local/bin/cybervex-update and nothing else (no shell, no forwarding).
set -euo pipefail

APP_DIR="/var/www/cybervex"
KEYS="/root/.ssh/authorized_keys"
MARK="github-actions-deploy@cybervex"

[ "$(id -u)" -eq 0 ] || { echo "Run as root."; exit 1; }
read -r key
case "$key" in
  ssh-ed25519\ *) ;;
  *) echo "That doesn't look like an ed25519 public key."; exit 1 ;;
esac

install -o root -g root -m 700 "$APP_DIR/deploy/update.sh" /usr/local/bin/cybervex-update

install -m 700 -d /root/.ssh
touch "$KEYS"
# Replace any earlier deploy key line, keep every other key
grep -v "$MARK" "$KEYS" > "$KEYS.new" || true
printf 'command="/usr/local/bin/cybervex-update",restrict %s %s\n' "$(echo "$key" | awk '{print $1, $2}')" "$MARK" >> "$KEYS.new"
install -m 600 "$KEYS.new" "$KEYS"
rm -f "$KEYS.new"
echo "DONE: GitHub deploy key added (it can only update the website)."
