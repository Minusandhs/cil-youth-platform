#!/bin/bash
# ================================================================
# init-letsencrypt.sh
# Run ONCE on the server to bootstrap SSL certificates.
# After this, Certbot auto-renews every 12h via the certbot service.
# ================================================================

set -euo pipefail

DOMAIN="cilyouth.org"
EMAIL="admin@cilyouth.org"        # ← change to your real email for expiry alerts
STAGING=0                          # set to 1 to test without hitting rate limits

# ── Paths inside Docker volumes ──────────────────────────────────
DATA_PATH="./certbot"
CONF_PATH="$DATA_PATH/conf"
WWW_PATH="$DATA_PATH/www"

# ── 1. Create directories ────────────────────────────────────────
mkdir -p "$CONF_PATH" "$WWW_PATH"

# ── 2. Download recommended TLS parameters ───────────────────────
if [ ! -e "$CONF_PATH/options-ssl-nginx.conf" ]; then
  echo "### Downloading recommended TLS parameters ..."
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    -o "$CONF_PATH/options-ssl-nginx.conf"

  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem \
    -o "$CONF_PATH/ssl-dhparams.pem"
fi

# ── 3. Create a temporary self-signed cert so nginx can start ────
# (nginx won't start without *some* cert when the HTTPS block is present)
if [ ! -e "$CONF_PATH/live/$DOMAIN/privkey.pem" ]; then
  echo "### Creating temporary self-signed certificate ..."
  mkdir -p "$CONF_PATH/live/$DOMAIN"
  docker compose -f docker-compose.prod.yml run --rm --entrypoint \
    "openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
      -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
      -out    /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
      -subj '/CN=localhost'" certbot
fi

# ── 4. Start nginx (it can now start with the dummy cert) ────────
echo "### Starting nginx ..."
docker compose -f docker-compose.prod.yml up --force-recreate -d client

# ── 5. Delete the dummy cert ─────────────────────────────────────
echo "### Deleting temporary certificate ..."
docker compose -f docker-compose.prod.yml run --rm --entrypoint \
  "rm -rf /etc/letsencrypt/live/$DOMAIN && \
   rm -rf /etc/letsencrypt/archive/$DOMAIN && \
   rm -rf /etc/letsencrypt/renewal/$DOMAIN.conf" certbot

# ── 6. Request the real cert from Let's Encrypt ──────────────────
echo "### Requesting Let's Encrypt certificate for $DOMAIN ..."

STAGING_FLAG=""
if [ "$STAGING" = "1" ]; then
  STAGING_FLAG="--staging"
fi

docker compose -f docker-compose.prod.yml run --rm --entrypoint \
  "certbot certonly --webroot \
    -w /var/www/certbot \
    $STAGING_FLAG \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN" certbot

# ── 7. Reload nginx with the real cert ───────────────────────────
echo "### Reloading nginx ..."
docker compose -f docker-compose.prod.yml exec client nginx -s reload

echo ""
echo "✓ SSL setup complete! cilyouth.org is now served over HTTPS."
echo "  Certbot will auto-renew every 12h via the certbot service."
