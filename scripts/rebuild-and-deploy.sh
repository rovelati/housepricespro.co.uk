#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "=========================================================="
echo "🏠 HousePricesPro UK — Rebuild & Deploy Pipeline"
echo "Timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "=========================================================="

export CLOUDFLARE_ACCOUNT_ID="383050c9ba92a1ab1144bc18d44f586c"
export CLOUDFLARE_API_KEY="9578b8b72ddb8947067606c42533c784203b6"
export CLOUDFLARE_EMAIL="romolo.velati@gmail.com"

# 1. Pull latest code if on git repo
if [ -d ".git" ]; then
  echo "📥 Checking git updates..."
  git pull origin main || true
fi

# 2. Ingest HM Land Registry Data into PostgreSQL
if [ -f "scripts/ingest_land_registry.py" ]; then
  echo "⚙️ Running Land Registry Data Ingestion..."
  python3 scripts/ingest_land_registry.py || echo "Ingestion skipped or completed with warnings"
fi

# 3. Build Astro Static Site
echo "🔨 Building Astro Static Pages..."
npm run build

# 4. Deploy to Cloudflare Pages
echo "🚀 Deploying to Cloudflare Pages (housepricespro)..."
npx -y wrangler pages deploy dist --project-name=housepricespro --commit-dirty=true

# 5. Ping IndexNow
echo "📡 Submitting sitemap and URLs to IndexNow..."
node scripts/notify-indexnow.js || true

echo "=========================================================="
echo "✅ HousePricesPro UK deployment completed successfully!"
echo "=========================================================="
