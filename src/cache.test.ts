import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getCachePath,
  loadCache,
  saveCache,
  getCache,
  setCache,
  deleteCache,
  clearCache,
  pruneExpired,
} from './cache';

const ORIG_HOME = process.env.HOME;
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-test-'));
  process.env.HOME = tmpDir;
});

afterEach(() => {
  process.env.HOME = ORIG_HOME;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('getCachePath returns path under home', () => {
  expect(getCachePath()).toContain('.stacktrace-link');
  expect(getCachePath()).toContain('cache.json');
});

test('loadCache returns empty cache when file missing', () => {
  expect(loadCache()).toEqual({ entries: {} });
});

test('setCache and getCache round-trip', () => {
  setCache('foo', { bar: 1 });
  expect(getCache('foo')).toEqual({ bar: 1 });
});

test('getCache returns undefined for missing key', () => {
  expect(getCache('missing')).toBeUndefined();
});

test('getCache respects TTL expiry', () => {
  const cache = loadCache();
  cache.entries['old'] = { key: 'old', value: 42, createdAt: Date.now() - 10000, ttl: 5 };
  saveCache(cache);
  expect(getCache('old')).toBeUndefined();
});

test('getCache returns value within TTL', () => {
  setCache('fresh', 'hello', 3600);
  expect(getCache('fresh')).toBe('hello');
});

test('deleteCache removes entry', () => {
  setCache('x', 1);
  expect(deleteCache('x')).toBe(true);
  expect(getCache('x')).toBeUndefined();
});

test('deleteCache returns false for missing key', () => {
  expect(deleteCache('nope')).toBe(false);
});

test('clearCache removes all entries', () => {
  setCache('a', 1);
  setCache('b', 2);
  clearCache();
  expect(loadCache()).toEqual({ entries: {} });
});

test('pruneExpired removes only expired entries', () => {
  setCache('live', 'yes', 3600);
  const cache = loadCache();
  cache.entries['dead'] = { key: 'dead', value: 'no', createdAt: Date.now() - 20000, ttl: 10 };
  saveCache(cache);
  const pruned = pruneExpired();
  expect(pruned).toBe(1);
  expect(getCache('live')).toBe('yes');
  expect(getCache('dead')).toBeUndefined();
});
