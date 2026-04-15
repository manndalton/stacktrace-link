import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { runScopeAdd, runScopeRemove, runScopeUse, runScopeList, runScopeShow, runScopeCli } from './scope-cli';
import { loadScopes, setActiveScope, addScope } from './scope';

let origHome: string;
let tmpDir: string;
const logs: string[] = [];
const errors: string[] = [];

beforeEach(() => {
  origHome = os.homedir();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scope-cli-'));
  Object.defineProperty(os, 'homedir', { value: () => tmpDir, configurable: true });
  logs.length = 0; errors.length = 0;
  jest.spyOn(console, 'log').mockImplementation(m => { logs.push(m); });
  jest.spyOn(console, 'error').mockImplementation(m => { errors.push(m); });
});

afterEach(() => {
  Object.defineProperty(os, 'homedir', { value: () => origHome, configurable: true });
  fs.rmSync(tmpDir, { recursive: true, force: true });
  jest.restoreAllMocks();
});

test('runScopeAdd adds a scope', () => {
  runScopeAdd(['myapp', '/app']);
  expect(logs[0]).toContain('myapp');
  expect(loadScopes().scopes['myapp']).toBeDefined();
});

test('runScopeAdd with include/exclude', () => {
  runScopeAdd(['myapp', '/app', '--include', 'src', '--exclude', 'node_modules']);
  const s = loadScopes().scopes['myapp'];
  expect(s.include).toContain('src');
  expect(s.exclude).toContain('node_modules');
});

test('runScopeRemove removes scope', () => {
  addScope('myapp', '/app', [], []);
  runScopeRemove(['myapp']);
  expect(logs[0]).toContain('removed');
  expect(loadScopes().scopes['myapp']).toBeUndefined();
});

test('runScopeRemove exits on missing', () => {
  const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  expect(() => runScopeRemove(['ghost'])).toThrow('exit');
  exit.mockRestore();
});

test('runScopeUse sets active', () => {
  addScope('myapp', '/app', [], []);
  runScopeUse(['myapp']);
  expect(loadScopes().active).toBe('myapp');
  expect(logs[0]).toContain('myapp');
});

test('runScopeList shows scopes', () => {
  addScope('a', '/a', [], []);
  addScope('b', '/b', [], []);
  setActiveScope('a');
  runScopeList();
  const out = logs.join('\n');
  expect(out).toContain('* a');
  expect(out).toContain('  b');
});

test('runScopeShow shows active scope', () => {
  addScope('myapp', '/app', ['src'], ['dist']);
  setActiveScope('myapp');
  runScopeShow();
  const out = logs.join('\n');
  expect(out).toContain('/app');
  expect(out).toContain('src');
});

test('runScopeCli clear clears active', () => {
  addScope('myapp', '/app', [], []);
  setActiveScope('myapp');
  runScopeCli(['clear']);
  expect(loadScopes().active).toBeNull();
});
