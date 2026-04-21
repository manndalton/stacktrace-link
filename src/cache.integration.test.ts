import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { setCache, getCache, pruneExpired, clearCache, loadCache, saveCache } from './cache';

const ORIG_HOME = process.env.HOME;
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-int-'));
  process.env.HOME = tmpDir;
});

afterEach(() => {
  process.env.HOME = ORIG_HOME;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('persists cache across loadCache calls', () => {
  setCache('persist', { nested: true }, 3600);
  const loaded = loadCache();
  expect(loaded.entries['persist'].value).toEqual({ nested: true });
});

test('expired entries are not returned and file is updated', () => {
  const cache = loadCache();
  cache.entries['expired'] = { key: 'expired', value: 'gone', createdAt: Date.now() - 60000, ttl: 30 };
  saveCache(cache);
  const val = getCache('expired');
  expect(val).toBeUndefined();
  const reloaded = loadCache();
  expect(reloaded.entries['expired']).toBeUndefined();
});

test('pruneExpired cleans multiple entries and leaves valid ones', () => {
  const now = Date.now();
  const cache = loadCache();
  cache.entries['e1'] = { key: 'e1', value: 1, createdAt: now - 5000, ttl: 1 };
  cache.entries['e2'] = { key: 'e2', value: 2, createdAt: now - 5000, ttl: 1 };
  cache.entries['ok'] = { key: 'ok', value: 3, createdAt: now, ttl: 3600 };
  saveCache(cache);
  const pruned = pruneExpired();
  expect(pruned).toBe(2);
  expect(getCache('ok')).toBe(3);
});

test('clearCache removes all and file reflects empty state', () => {
  setCache('a', 1);
  setCache('b', 2);
  clearCache();
  const raw = fs.readFileSync(
    path.join(tmpDir, '.stacktrace-link', 'cache.json'),
    'utf8'
  );
  expect(JSON.parse(raw)).toEqual({ entries: {} });
});
