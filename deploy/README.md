# Deploying to a Hostinger VPS (Ubuntu 22.04 / 24.04)

The VPS runs everything: the website, the admin panel and the API (Node.js), MongoDB
(password-protected, reachable only from the VPS), and Nginx with a free HTTPS certificate.

## 1. Point the domain at the VPS

In Hostinger → Domains → cybervexdigital.com → DNS, set two **A** records to the VPS IP
(shown in hPanel → VPS → Overview), and remove any other A/AAAA/CNAME records for them:

| Name  | Type | Points to |
| ----- | ---- | --------- |
| `@`   | A    | VPS IP    |
| `www` | A    | VPS IP    |

## 2. (Optional) bring your existing data

On your PC, in the project folder:

```
node deploy/export-data.mjs
scp cybervex-data.json root@VPS_IP:/root/
```

This copies your projects (with uploaded images), jobs, applications and messages.
Delete `cybervex-data.json` afterwards — it contains applicants' personal data.

## 3. Run the setup (once)

Open hPanel → VPS → **Browser terminal** (or `ssh root@VPS_IP`) and run:

```
curl -fsSL https://raw.githubusercontent.com/KhizarTanveer/Cybervex/main/deploy/setup-vps.sh -o setup-vps.sh
bash setup-vps.sh
```

It asks for the admin panel email, a **new** admin password, and the Titan mail
password (typing is hidden). It takes about 5–10 minutes. If DNS hasn't updated yet,
HTTPS is skipped — run `bash setup-vps.sh` again later and it finishes that step.

## 4. Publish updates

After pushing changes to GitHub:

```
bash /var/www/cybervex/deploy/update.sh
```

## Useful commands

| What | Command |
| ---- | ------- |
| Live logs | `journalctl -u cybervex -f` |
| Restart the site | `systemctl restart cybervex` |
| Settings (passwords, email) | `nano /var/www/cybervex/server/.env`, then restart |
| Backups (daily, 14 days) | `ls /var/backups/cybervex` |
| MongoDB in Compass | SSH tunnel: `ssh -L 27018:127.0.0.1:27017 root@VPS_IP`, then connect Compass to `mongodb://admin:PASSWORD@localhost:27018/?authSource=admin` (password in `/root/.cybervex-mongo`) |
