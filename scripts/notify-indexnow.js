import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcodesData from '../src/data/uk_postcodes_summary.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.resolve(__dirname, '../.indexnow-submitted.json');

const HOST = 'housepricespro.co.uk';
const KEY = 'c83f6b45a2784d1297e510842e47c1a8';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

// Max age before re-pinging an existing URL (7 days)
const RECHECK_DAYS = 7;
const RECHECK_MS = RECHECK_DAYS * 24 * 60 * 60 * 1000;

const args = process.argv.slice(2);
const isForce = args.includes('--force');
const outcodeArg = args.find(a => a.startsWith('--outcode='));

// Load cache
let cache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  } catch (e) {
    cache = {};
  }
}

// Core evergreen URLs always included in routine updates
const CORE_URLS = new Set([
  `https://${HOST}/`,
  `https://${HOST}/free-valuation/`,
  `https://${HOST}/mortgage-calculator/`,
  `https://${HOST}/stamp-duty-calculator/`,
  `https://${HOST}/conveyancing-quotes/`,
  `https://${HOST}/data-methodology/`
]);

let targetUrls = [];

if (outcodeArg) {
  // Single outcode on-demand submission
  const outcode = outcodeArg.split('=')[1].trim().toLowerCase();
  targetUrls = [`https://${HOST}/postcode/${outcode}/`];
  console.log(`🎯 On-demand IndexNow request for Postcode: ${outcode.toUpperCase()}`);
} else {
  // Build full candidate list
  const allCandidates = [
    ...CORE_URLS,
    `https://${HOST}/privacy/`,
    `https://${HOST}/cookies/`
  ];

  for (const item of postcodesData) {
    allCandidates.push(`https://${HOST}/postcode/${item.outcode}/`);
  }

  const now = Date.now();
  targetUrls = allCandidates.filter(url => {
    if (isForce) return true;
    if (CORE_URLS.has(url)) return true; // Always ping core pages
    const lastSent = cache[url] ? new Date(cache[url]).getTime() : 0;
    return now - lastSent > RECHECK_MS; // Only new or expired URLs
  });

  console.log(
    `📡 IndexNow Analysis: ${allCandidates.length} total URLs in catalogue. ` +
    `${Object.keys(cache).length} in history cache. ` +
    `Selected ${targetUrls.length} URLs for submission ` +
    `(${CORE_URLS.size} core + ${targetUrls.length - CORE_URLS.size} new/due).`
  );
}

if (targetUrls.length === 0) {
  console.log('✅ All non-core URLs are fresh in cache. No submission needed.');
  process.exit(0);
}

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: targetUrls
};

const endpoints = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow'
];

async function submit() {
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload)
      });
      console.log(`[IndexNow] ${endpoint} -> Status: ${res.status} (${res.statusText})`);
    } catch (err) {
      console.error(`[IndexNow Error] ${endpoint}:`, err.message);
    }
  }

  // Update submission timestamps in cache
  const timestamp = new Date().toISOString();
  targetUrls.forEach(url => {
    cache[url] = timestamp;
  });

  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
    console.log(`💾 Updated submission cache: ${Object.keys(cache).length} URLs tracked.`);
  } catch (err) {
    console.error('Failed to write IndexNow cache:', err.message);
  }
}

submit();
