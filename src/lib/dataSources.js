import { logApp } from './log.js';
import { DEMO_TLE } from './tle.js';

// CelesTrak allows one download per group per IP every 2 hours and answers 403
// to anything more frequent, so successful downloads are cached in localStorage.
const CACHE_KEY = 'tle-cache-v1';
const CACHE_TTL_MS = 2 * 3600 * 1000;

// Each source is free, needs no API key, and sends CORS headers.
// The bundled snapshot keeps the demo working offline / when both live sources are down.
const SNAPSHOT_URL = `${import.meta.env.BASE_URL}data/tle-snapshot.txt`;
const SOURCES = [
  { url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle', toTle: (t) => t },
  {
    url: 'https://tle.ivanstanojevic.me/api/tle/?page-size=50',
    toTle: (t) => JSON.parse(t).member.map((s) => `${s.name}\n${s.line1}\n${s.line2}`).join('\n'),
  },
  { url: SNAPSHOT_URL, toTle: (t) => t },
];

// Resolves to { tle: string, source: string }. Never rejects: falls back to
// cached data, then to five built-in demo satellites.
export async function loadTleText() {
  const forced = new URLSearchParams(location.search).get('source'); // 'snapshot' or a URL
  const cached = readCache();

  if (!forced && cached && Date.now() - cached.time < CACHE_TTL_MS) {
    const ageMin = Math.round((Date.now() - cached.time) / 60000);
    logApp(`Using cached TLEs from ${cached.source} (${ageMin} min old)`);
    return { tle: cached.tle, source: `${cached.source} (cached)` };
  }

  let sources = SOURCES;
  if (forced === 'snapshot') sources = [SOURCES[2]];
  else if (forced) sources = [{ url: forced, toTle: (t) => t }];

  for (const { url, toTle } of sources) {
    try {
      logApp(`Trying: ${url}`);
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) {
        logApp(`HTTP ${response.status} from ${url}`, 'warn');
        continue;
      }
      const tle = toTle(await response.text());
      logApp(`Success with ${url}`);
      if (url.startsWith('http')) writeCache({ time: Date.now(), source: url, tle });
      return { tle, source: url };
    } catch (e) {
      logApp(`Failed ${url}: ${e.message}`, 'warn');
    }
  }

  if (cached) {
    logApp(`All sources failed; using stale cache from ${cached.source}`, 'warn');
    return { tle: cached.tle, source: `${cached.source} (stale cache)` };
  }
  logApp('All data sources failed; using 5 built-in demo satellites', 'warn');
  return { tle: DEMO_TLE, source: 'built-in demo data' };
}

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
  } catch {
    return null;
  }
}

function writeCache(value) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch (e) {
    logApp(`Could not cache TLEs: ${e.message}`, 'warn');
  }
}
