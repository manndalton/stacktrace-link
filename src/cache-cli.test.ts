import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runGet, runSet, runDelete, runList, runCacheCli } from './cache-cli';
import { clearCache, setCache, loadCache } from './cache';

const ORIG_HOME = process.env.HOME;
let tmpDir: string;
let output: string[];
let errors: string[];

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-cli-test-'));
  process.env.HOME = tmpDir;
  clearCache();
  output = [];
  errors = [];
  jest.spyOn(console, 'log').mockImplementation((...a) => output.push(a.join(' ')));
  jest.spyOn(console, 'error').mockImplementation((...a) => errors.push(a.join(' ')));
});

afterEach(() => {
  process.env.HOME = ORIG_HOME;
  fs.rmSync(tmpDir, { recursive: true, force: true });
  jest.restoreAllMocks();
  delete process.exitCode;
});

test('runSet stores value and runGet retrieves it', () => {
  runSet('mykey', '"hello"');
  runGet('mykey');
  expect(output.some(l => l.includes('hello'))).toBe(true);
});

test('runGet exits with code 1 on miss', () => {
  runGet('nope');
  expect(process.exitCode).toBe(1);
  expect(errors.some(e => e.includes('Cache miss'))).toBe(true);
});

test('runSet with non-JSON stores as string', () => {
  runSet('raw', 'plaintext');
  const val = loadCache().entries['raw'].value;
  expect(val).toBe('plaintext');
});

test('runDelete removes entry', () => {
  setCache('todel', 42);
  runDelete('todel');
  expect(output.some(l => l.includes('Deleted'))).toBe(true);
});

test('runDelete sets exitCode on missing key', () => {
  runDelete('ghost');
  expect(process.exitCode).toBe(1);
});

test('runList prints keys', () => {
  setCache('alpha', 1);
  setCache('beta', 2);
  runList();
  expect(output.some(l => l.includes('alpha'))).toBe(true);
  expect(output.some(l => l.includes('beta'))).toBe(true);
});

test('runList prints empty message when no entries', () => {
  runList();
  expect(output.some(l => l.includes('empty'))).toBe(true);
});

test('runCacheCli clear command', () => {
  setCache('x', 1);
  runCacheCli(['clear']);
  expect(output.some(l => l.includes('cleared'))).toBe(true);
  expect(Object.keys(loadCache().entries)).toHaveLength(0);
});

test('runCacheCli prune command', () => {
  runCacheCli(['prune']);
  expect(output.some(l => l.includes('Pruned'))).toBe(true);
});
