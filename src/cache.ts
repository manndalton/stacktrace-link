import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface CacheEntry {
  key: string;
  value: unknown;
  createdAt: number;
  ttl: number; // seconds, 0 = no expiry
}

export interface Cache {
  entries: Record<string, CacheEntry>;
}

export function getCachePath(): string {
  return path.join(os.homedir(), '.stacktrace-link', 'cache.json');
}

export function loadCache(): Cache {
  const p = getCachePath();
  if (!fs.existsSync(p)) return { entries: {} };
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as Cache;
  } catch {
    return { entries: {} };
  }
}

export function saveCache(cache: Cache): void {
  const p = getCachePath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(cache, null, 2));
}

export function getCache(key: string): unknown | undefined {
  const cache = loadCache();
  const entry = cache.entries[key];
  if (!entry) return undefined;
  if (entry.ttl > 0 && Date.now() - entry.createdAt > entry.ttl * 1000) {
    delete cache.entries[key];
    saveCache(cache);
    return undefined;
  }
  return entry.value;
}

export function setCache(key: string, value: unknown, ttl = 0): void {
  const cache = loadCache();
  cache.entries[key] = { key, value, createdAt: Date.now(), ttl };
  saveCache(cache);
}

export function deleteCache(key: string): boolean {
  const cache = loadCache();
  if (!cache.entries[key]) return false;
  delete cache.entries[key];
  saveCache(cache);
  return true;
}

export function clearCache(): void {
  saveCache({ entries: {} });
}

export function pruneExpired(): number {
  const cache = loadCache();
  const now = Date.now();
  let pruned = 0;
  for (const key of Object.keys(cache.entries)) {
    const e = cache.entries[key];
    if (e.ttl > 0 && now - e.createdAt > e.ttl * 1000) {
      delete cache.entries[key];
      pruned++;
    }
  }
  if (pruned > 0) saveCache(cache);
  return pruned;
}
