#!/usr/bin/env bash
# One-time setup of the Cybervex Digital website on a fresh Ubuntu 22.04 / 24.04 / 26.04 VPS.
# Installs Node.js, MongoDB (password-protected, local only), Nginx + HTTPS, a firewall,
# and runs the site (website + admin panel + API) as a system service.
#
#   As root on the VPS:
#     curl -fsSL https://raw.githubusercontent.com/KhizarTanveer/Cybervex/main/deploy/setup-vps.sh -o setup-vps.sh
#     bash setup-vps.sh
#
# It asks for the admin login and the email password (typing is hidden); nothing secret is
# stored in GitHub. Safe to run again: finished steps are skipped or refreshed.
# Optional: put cybervex-data.json (from deploy/export-data.mjs) in /root first to bring
# your existing projects, jobs and applications across.
set -euo pipefail

DOMAIN="www.cybervexdigital.com"
APEX_DOMAIN="cybervexdigital.com"
REPO="https://github.com/KhizarTanveer/Cybervex.git"
APP_USER="cybervex"
APP_DIR="/var/www/cybervex"
ENV_FILE="$APP_DIR/server/.env"
DB_NAME="cybervex"
DATA_FILE="/root/cybervex-data.json"
SECRETS_FILE="/root/.cybervex-mongo" # MongoDB passwords, readable by root only
NODE_MAJOR=22

say() { printf '\n\033[1;33m==> %s\033[0m\n' "$*"; }
ok() { printf '\033[1;32m    ✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;31m    ! %s\033[0m\n' "$*"; }

[ "$(id -u)" -eq 0 ] || { echo "Run this as root (sudo -i first)."; exit 1; }
. /etc/os-release
case "$VERSION_CODENAME" in
  jammy|noble|resolute) ;;
  *) echo "This script supports Ubuntu 22.04, 24.04 and 26.04; found $PRETTY_NAME."; exit 1 ;;
esac

ask() { # ask VAR "Question" "default"
  local reply
  read -r -p "$2${3:+ [$3]}: " reply
  printf -v "$1" '%s' "${reply:-$3}"
}
ask_secret() { # ask_secret VAR "Question" — hidden, typed twice
  local a b
  while true; do
    read -r -s -p "$2: " a; echo
    read -r -s -p "Type it again: " b; echo
    [ "$a" = "$b" ] && [ -n "$a" ] && break
    warn "Empty or not matching — try again."
  done
  printf -v "$1" '%s' "$a"
}
env_quote() { # quote a value for server/.env (Node's --env-file format)
  case "$1" in
    *"'"*) printf '"%s"' "$1" ;;
    *) printf "'%s'" "$1" ;;
  esac
}

# ------------------------------------------------------------------ packages
say "Installing system packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -y -q
apt-get install -y -q curl git gnupg ca-certificates nginx ufw fail2ban unattended-upgrades \
  certbot python3-certbot-nginx openssl dnsutils
dpkg-reconfigure -f noninteractive unattended-upgrades
ok "System packages ready (automatic security updates on)"

if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt "$NODE_MAJOR" ]; then
  say "Installing Node.js $NODE_MAJOR"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y -q nodejs
fi
ok "Node.js $(node -v)"

if ! command -v mongod >/dev/null; then
  say "Installing MongoDB 8.0"
  curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg --dearmor --yes -o /usr/share/keyrings/mongodb-server-8.0.gpg
  # MongoDB doesn't publish the server for 26.04 yet; the 24.04 (noble) build runs on it
  # (it only needs libc6 >= 2.38, libssl3t64 and libcurl4t64, which 26.04 has)
  MONGO_CODENAME="$VERSION_CODENAME"
  [ "$VERSION_CODENAME" = "resolute" ] && MONGO_CODENAME="noble"
  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${MONGO_CODENAME}/mongodb-org/8.0 multiverse" \
    > /etc/apt/sources.list.d/mongodb-org-8.0.list
  apt-get update -q
  apt-get install -y -q mongodb-org
fi
systemctl enable --now mongod
for _ in $(seq 1 30); do mongosh --quiet --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1 && break; sleep 1; done
ok "MongoDB $(mongod --version | head -1 | awk '{print $3}') running (only reachable from this server)"

# ------------------------------------------------------- MongoDB passwords
if [ ! -f "$SECRETS_FILE" ]; then
  say "Protecting MongoDB with passwords"
  MONGO_ADMIN_PASS="$(openssl rand -hex 24)"
  MONGO_APP_PASS="$(openssl rand -hex 24)"
  mongosh --quiet admin --eval "
    db.createUser({ user: 'admin', pwd: '$MONGO_ADMIN_PASS', roles: ['root'] });
    db.getSiblingDB('$DB_NAME').createUser({ user: '$APP_USER', pwd: '$MONGO_APP_PASS', roles: [{ role: 'readWrite', db: '$DB_NAME' }] });
  " >/dev/null
  umask 077
  printf 'MONGO_ADMIN_PASS=%s\nMONGO_APP_PASS=%s\n' "$MONGO_ADMIN_PASS" "$MONGO_APP_PASS" > "$SECRETS_FILE"
  umask 022
  if ! grep -q '^security:' /etc/mongod.conf; then
    printf '\nsecurity:\n  authorization: enabled\n' >> /etc/mongod.conf
  fi
  systemctl restart mongod
  for _ in $(seq 1 30); do mongosh --quiet --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1 && break; sleep 1; done
  ok "MongoDB now requires a password (saved for root in $SECRETS_FILE)"
fi
. "$SECRETS_FILE"
grep -q '^  bindIp: 127.0.0.1' /etc/mongod.conf && ok "MongoDB listens on 127.0.0.1 only"

# ------------------------------------------------------------- app code
id "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --home-dir "/home/$APP_USER" --shell /usr/sbin/nologin "$APP_USER"
if [ -d "$APP_DIR/.git" ]; then
  say "Updating the code from GitHub"
  sudo -u "$APP_USER" git -C "$APP_DIR" pull --ff-only
else
  say "Downloading the code from GitHub"
  mkdir -p "$APP_DIR"
  chown "$APP_USER:$APP_USER" "$APP_DIR"
  sudo -u "$APP_USER" git clone "$REPO" "$APP_DIR"
fi
ok "Code at $APP_DIR ($(sudo -u "$APP_USER" git -C "$APP_DIR" log -1 --format='%h %s'))"

say "Installing dependencies and building the website"
cd "$APP_DIR"
sudo -u "$APP_USER" HOME="/home/$APP_USER" npm ci --no-audit --no-fund
sudo -u "$APP_USER" HOME="/home/$APP_USER" npm run build
ok "Website built"

# ------------------------------------------------------------- settings
if [ ! -f "$ENV_FILE" ]; then
  say "Site settings (server/.env)"
  ask ADMIN_EMAIL "Admin panel login email" "info@cybervexdigital.com"
  echo "Choose a NEW admin panel password (at least 12 characters)."
  while true; do
    ask_secret ADMIN_PASSWORD "Admin password"
    [ "${#ADMIN_PASSWORD}" -ge 12 ] && break
    warn "Use at least 12 characters."
  done
  ADMIN_HASH="$(printf '%s\n' "$ADMIN_PASSWORD" | sudo -u "$APP_USER" node server/hash-password.js | grep '^ADMIN_PASSWORD_HASH=' | cut -d= -f2-)"
  unset ADMIN_PASSWORD
  ask SMTP_USER "Email account that sends notifications" "info@cybervexdigital.com"
  ask_secret SMTP_PASS "Password of $SMTP_USER (Titan mail)"
  umask 077
  cat > "$ENV_FILE" <<EOF
# Created by deploy/setup-vps.sh — never commit this file
NODE_ENV=production
HOST=127.0.0.1
PORT=4000
TRUST_PROXY=loopback

MONGODB_URI=mongodb://$APP_USER:$MONGO_APP_PASS@127.0.0.1:27017/$DB_NAME?authSource=$DB_NAME
MONGODB_DB=$DB_NAME

ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD_HASH=$ADMIN_HASH
SESSION_SECRET=$(openssl rand -hex 32)

SMTP_HOST=smtp.titan.email
SMTP_PORT=465
SMTP_USER=$SMTP_USER
SMTP_PASS=$(env_quote "$SMTP_PASS")
MAIL_FROM_NAME=Cybervex Digital
NOTIFY_TO=$SMTP_USER
EOF
  umask 022
  unset SMTP_PASS
  chown "$APP_USER:$APP_USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  ok "Settings saved to server/.env (readable by the site only)"
else
  ok "Keeping existing server/.env"
fi

# --------------------------------------------- existing data (first run only)
if [ -f "$DATA_FILE" ] && [ ! -f "$APP_DIR/.data-imported" ]; then
  say "Importing your existing data from $DATA_FILE"
  cp "$DATA_FILE" /tmp/cybervex-data.json && chown "$APP_USER" /tmp/cybervex-data.json
  sudo -u "$APP_USER" node --env-file="$ENV_FILE" deploy/import-data.mjs /tmp/cybervex-data.json --replace
  rm -f /tmp/cybervex-data.json
  sudo -u "$APP_USER" touch "$APP_DIR/.data-imported"
  ok "Data imported — you can delete $DATA_FILE"
fi

# ------------------------------------------------------------- service
say "Running the site as a service"
cat > /etc/systemd/system/cybervex.service <<EOF
[Unit]
Description=Cybervex Digital website and API
After=network.target mongod.service
Requires=mongod.service

[Service]
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node --env-file=$ENV_FILE server/index.js
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
# Root-owned copy of the update script: the GitHub deploy key may run only this
install -o root -g root -m 700 "$APP_DIR/deploy/update.sh" /usr/local/bin/cybervex-update
systemctl daemon-reload
systemctl enable cybervex >/dev/null
systemctl restart cybervex
for _ in $(seq 1 30); do curl -fs http://127.0.0.1:4000/api/jobs >/dev/null && break; sleep 1; done
curl -fs http://127.0.0.1:4000/api/jobs >/dev/null && ok "Site is running" || { warn "Site did not start — see: journalctl -u cybervex -n 50"; exit 1; }

# --------------------------------------------------------------- nginx
say "Configuring Nginx"
cat > /etc/nginx/sites-available/cybervex <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN $APEX_DOMAIN;

    # Resumes and project images are up to 5 MB
    client_max_body_size 6m;
    server_tokens off;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }
}
EOF
ln -sf /etc/nginx/sites-available/cybervex /etc/nginx/sites-enabled/cybervex
rm -f /etc/nginx/sites-enabled/default
nginx -t -q
systemctl reload nginx
ok "Nginx forwards $DOMAIN to the site"

# ------------------------------------------------------------ firewall
say "Firewall"
ufw allow OpenSSH >/dev/null
ufw allow 'Nginx Full' >/dev/null
ufw --force enable >/dev/null
systemctl enable --now fail2ban >/dev/null
ok "Only SSH (22), HTTP (80) and HTTPS (443) are open; fail2ban blocks SSH password guessing"

# -------------------------------------------------------------- backups
say "Daily database backups"
mkdir -p /var/backups/cybervex
chmod 700 /var/backups/cybervex
cat > /usr/local/bin/cybervex-backup <<EOF
#!/usr/bin/env bash
# Daily MongoDB backup of the Cybervex site, kept for 14 days
set -euo pipefail
. $SECRETS_FILE
mongodump --quiet --username admin --password "\$MONGO_ADMIN_PASS" --authenticationDatabase admin \\
  --db $DB_NAME --gzip --archive="/var/backups/cybervex/cybervex-\$(date +%F).archive.gz"
find /var/backups/cybervex -name '*.archive.gz' -mtime +14 -delete
EOF
chmod 700 /usr/local/bin/cybervex-backup
echo "30 3 * * * root /usr/local/bin/cybervex-backup" > /etc/cron.d/cybervex-backup
/usr/local/bin/cybervex-backup && ok "Backups run daily at 03:30 into /var/backups/cybervex (kept 14 days)"

# ---------------------------------------------------------------- HTTPS
say "HTTPS certificate"
SERVER_IP="$(curl -fs4 https://api.ipify.org || hostname -I | awk '{print $1}')"
DNS_WWW="$(dig +short A "$DOMAIN" | tail -1)"
DNS_APEX="$(dig +short A "$APEX_DOMAIN" | tail -1)"
if [ "$DNS_WWW" = "$SERVER_IP" ] && [ "$DNS_APEX" = "$SERVER_IP" ]; then
  certbot --nginx -n --agree-tos --redirect -m "info@cybervexdigital.com" -d "$DOMAIN" -d "$APEX_DOMAIN"
  # Send cybervexdigital.com to www.cybervexdigital.com
  sed -i "0,/server_name $DOMAIN $APEX_DOMAIN;/s//server_name $DOMAIN $APEX_DOMAIN;\n    if (\$host = $APEX_DOMAIN) { return 301 https:\/\/$DOMAIN\$request_uri; }/" /etc/nginx/sites-available/cybervex
  nginx -t -q && systemctl reload nginx
  ok "HTTPS is on: https://$DOMAIN (renews automatically)"
else
  warn "Skipped for now: the domain doesn't point to this server yet."
  warn "  $DOMAIN -> ${DNS_WWW:-nothing}, $APEX_DOMAIN -> ${DNS_APEX:-nothing}, this server is $SERVER_IP"
  warn "  In Hostinger DNS, set A records for @ and www to $SERVER_IP, wait a few minutes, then run this script again."
fi

say "Done"
echo "  Website:      http://$SERVER_IP  (and https://$DOMAIN once DNS + HTTPS are set)"
echo "  Admin panel:  at its private address (see src/lib/adminPath.js)"
echo "  Logs:         journalctl -u cybervex -f"
echo "  Update later: bash $APP_DIR/deploy/update.sh"
