import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { addScope, setActiveScope, getActiveScope, removeScope, matchesScope } from './scope';

let origHome: string;
let tmpDir: string;

beforeEach(() => {
  origHome = os.homedir();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scope-int-'));
  Object.defineProperty(os, 'homedir', { value: () => tmpDir, configurable: true });
});

afterEach(() => {
  Object.defineProperty(os, 'homedir', { value: () => origHome, configurable: true });
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('full lifecycle: add, activate, use, remove', () => {
  addScope('proj', '/projects/myapp', ['src', 'lib'], ['node_modules', 'dist']);
  setActiveScope('proj');

  const active = getActiveScope();
  expect(active).not.toBeNull();
  expect(active!.rootDir).toBe('/projects/myapp');

  expect(matchesScope('/projects/myapp/src/index.ts', active!)).toBe(true);
  expect(matchesScope('/projects/myapp/lib/util.ts', active!)).toBe(true);
  expect(matchesScope('/projects/myapp/node_modules/lodash/index.js', active!)).toBe(false);
  expect(matchesScope('/projects/myapp/dist/bundle.js', active!)).toBe(false);
  expect(matchesScope('/projects/other/src/x.ts', active!)).toBe(false);

  removeScope('proj');
  expect(getActiveScope()).toBeNull();
});

test('multiple scopes, switching active', () => {
  addScope('frontend', '/repo/frontend', ['src'], []);
  addScope('backend', '/repo/backend', ['src'], []);

  setActiveScope('frontend');
  expect(getActiveScope()!.name).toBe('frontend');

  setActiveScope('backend');
  expect(getActiveScope()!.name).toBe('backend');

  expect(matchesScope('/repo/backend/src/server.ts', getActiveScope()!)).toBe(true);
  expect(matchesScope('/repo/frontend/src/app.ts', getActiveScope()!)).toBe(false);
});

test('scope persists across load calls', () => {
  addScope('persist', '/data', [], []);
  setActiveScope('persist');
  // Simulate a fresh load by calling getActiveScope again
  const reloaded = getActiveScope();
  expect(reloaded?.name).toBe('persist');
  expect(reloaded?.rootDir).toBe('/data');
});
