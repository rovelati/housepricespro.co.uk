#!/bin/bash
# rebuild-and-deploy.sh — HousePricesPro.co.uk
# Executed via crontab or manually on Contabo VPS
set -euo pipefail

LOG="/var/log/housepricespro-rebuild.log"
APP_DIR="/var/www/housepricespro.co.uk"
CF_PROJECT="housepricespro"

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"
if [ -d "${HOME:-/root}/.nvm" ]; then
  export NVM_DIR="${HOME:-/root}/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }

log "============================================================"
log "Starting HousePricesPro.co.uk Rebuild & Cloudflare Deploy..."

cd "$APP_DIR"

# 1. Update code from GitHub
if [ -d .git ]; then
  log "Fetching latest code from GitHub..."
  git fetch origin main || true
  git reset --hard origin/main || true
fi

# 2. Ingest HM Land Registry Data into PostgreSQL
if [ -f "scripts/ingest_land_registry.py" ]; then
  log "Running HM Land Registry Data Ingestion..."
  python3 scripts/ingest_land_registry.py 2>&1 | tee -a "$LOG" || log "Ingestion notice: proceeding with current database cache"
fi

# 3. Build Astro SSG
log "Building Astro static site for 2,100+ postcode districts..."
NODE_OPTIONS="--max-old-space-size=4096" npm run build 2>&1 | tee -a "$LOG"

# 4. Deploy Cloudflare Pages
log "Deploying to Cloudflare Pages project=$CF_PROJECT ..."
export CLOUDFLARE_API_KEY="${CLOUDFLARE_API_KEY:-9578b8b72ddb8947067606c42533c784203b6}"
export CLOUDFLARE_EMAIL="${CLOUDFLARE_EMAIL:-romolo.velati@gmail.com}"
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-383050c9ba92a1ab1144bc18d44f586c}"

npx --yes wrangler@4 pages deploy dist \
  --project-name="$CF_PROJECT" \
  --branch=main \
  --commit-dirty=true 2>&1 | tee -a "$LOG"

# 5. Notify IndexNow
log "Pinging IndexNow for Bing & search engines..."
node scripts/notify-indexnow.js 2>&1 | tee -a "$LOG" || true

log "HousePricesPro.co.uk Rebuild & Deploy SUCCESS!"
log "============================================================"
