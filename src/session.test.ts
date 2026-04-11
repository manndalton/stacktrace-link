import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadSession,
  saveSession,
  addSessionEntry,
  clearSession,
  getSessionEntry,
  getSessionPath,
} from './session';

const ORIG_HOME = os.homedir;

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stl-session-'));
  jest.spyOn(os, 'homedir').mockReturnValue(tmpDir);
  // Clear module-level cache by re-requiring would require jest.resetModules;
  // instead we directly write/read via the path helper.
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  jest.restoreAllMocks();
});

test('loadSession returns empty session when no file exists', () => {
  const session = loadSession();
  expect(session.entries).toEqual([]);
});

test('saveSession and loadSession round-trip', () => {
  const sessionPath = getSessionPath();
  fs.mkdirSync(path.dirname(sessionPath), { recursive: true });
  const data = { entries: [{ id: 'abc', startedAt: '2024-01-01T00:00:00Z', frames: ['a.ts:1'] }] };
  saveSession(data);
  const loaded = loadSession();
  expect(loaded.entries).toHaveLength(1);
  expect(loaded.entries[0].id).toBe('abc');
});

test('addSessionEntry appends an entry with id and startedAt', () => {
  const entry = addSessionEntry({ frames: ['src/foo.ts:10', 'src/bar.ts:20'] });
  expect(entry.id).toBeTruthy();
  expect(entry.startedAt).toBeTruthy();
  expect(entry.frames).toHaveLength(2);
  const session = loadSession();
  expect(session.entries).toHaveLength(1);
});

test('getSessionEntry returns the correct entry by id', () => {
  const e1 = addSessionEntry({ frames: ['a.ts:1'] });
  const e2 = addSessionEntry({ frames: ['b.ts:2'] });
  expect(getSessionEntry(e1.id)?.frames[0]).toBe('a.ts:1');
  expect(getSessionEntry(e2.id)?.frames[0]).toBe('b.ts:2');
  expect(getSessionEntry('nonexistent')).toBeUndefined();
});

test('clearSession removes all entries', () => {
  addSessionEntry({ frames: ['x.ts:5'] });
  clearSession();
  expect(loadSession().entries).toHaveLength(0);
});
