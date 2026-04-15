import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { addScope, removeScope, setActiveScope, getActiveScope, matchesScope, loadScopes, saveScopes } from './scope';

function makeTempStore(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scope-test-'));
  return path.join(dir, 'scopes.json');
}

let origHome: string;
let tmpDir: string;

beforeEach(() => {
  origHome = os.homedir();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scope-home-'));
  Object.defineProperty(os, 'homedir', { value: () => tmpDir, configurable: true });
});

afterEach(() => {
  Objecthomedir', { value: () => origHome, configurable: true });
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('addScope stores entry entry = addScope('myapp', '/app', ['src'], ['node_modules'])).toBe('myapp');
  const store = loadScopes();
  expect(store.scopes['myapp']).toBeDefined();
});

test('removeScope deletes entry', () => {
  addScope('myapp', '/app', [], []);
  const result = removeScope('myapp');
  expect(result).toBe(true);
  expect(loadScopes().scopes['myapp']).toBeUndefined();
});

test('removeScope returns false for missing', () => {
  expect(removeScope('nope')).toBe(false);
});

test('setActiveScope and getActiveScope', () => {
  addScope('myapp', '/app', [], []);
  setActiveScope('myapp');
  const active = getActiveScope();
  name).toBe('myapp');
});

test('setActiveScope clears on remove', () => {
  addScope('myapp', '/app', [], []);
  setActiveScope('myapp');
  removeScope('myapp');
  expect(getActiveScope()).toBeNull();
});

test('setActiveScope throws for unknown scope', () => {
  expect(() => setActiveScope('ghost')).toThrow();
});

test('matchesScope filters by rootDir', () => {
  const scope = { name: 's', rootDir: '/app', include: [], exclude: [], createdAt: '' };
  expect(matchesScope('/app/src/index.ts', scope)).toBe(true);
  expect(matchesScope('/other/file.ts', scope)).toBe(false);
});

test('matchesScope respects include', () => {
  const scope = { name: 's', rootDir: '/app', include: ['src'], exclude: [], createdAt: '' };
  expect(matchesScope('/app/src/foo.ts', scope)).toBe(true);
  expect(matchesScope('/app/lib/foo.ts', scope)).toBe(false);
});

test('matchesScope respects exclude', () => {
  const scope = { name: 's', rootDir: '/app', include: [], exclude: ['node_modules'], createdAt: '' };
  expect(matchesScope('/app/node_modules/x.js', scope)).toBe(false);
  expect(matchesScope('/app/src/x.ts', scope)).toBe(true);
});
