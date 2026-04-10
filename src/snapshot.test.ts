import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  generateId,
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  deleteSnapshot,
  getSnapshotDir,
  Snapshot,
} from './snapshot';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-test-'));

beforeEach(() => {
  process.env.XDG_DATA_HOME = tmpDir;
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const makeSnapshot = (label?: string): Snapshot => ({
  id: generateId(),
  timestamp: Date.now(),
  label,
  frames: [{ file: '/app/index.ts', line: 10, column: 5, fn: 'main', raw: '' }],
  raw: 'Error: boom\n  at main (/app/index.ts:10:5)',
});

test('generateId returns unique strings', () => {
  const a = generateId();
  const b = generateId();
  expect(typeof a).toBe('string');
  expect(a).not.toBe(b);
});

test('saveSnapshot writes file and loadSnapshot reads it back', () => {
  const snap = makeSnapshot('my label');
  saveSnapshot(snap);
  const loaded = loadSnapshot(snap.id);
  expect(loaded).not.toBeNull();
  expect(loaded!.id).toBe(snap.id);
  expect(loaded!.label).toBe('my label');
});

test('loadSnapshot returns null for unknown id', () => {
  expect(loadSnapshot('nonexistent-id')).toBeNull();
});

test('listSnapshots returns saved snapshots sorted newest first', () => {
  const s1 = { ...makeSnapshot(), timestamp: 1000 };
  const s2 = { ...makeSnapshot(), timestamp: 2000 };
  saveSnapshot(s1);
  saveSnapshot(s2);
  const list = listSnapshots();
  expect(list.length).toBeGreaterThanOrEqual(2);
  expect(list[0].timestamp).toBeGreaterThanOrEqual(list[1].timestamp);
});

test('deleteSnapshot removes the file', () => {
  const snap = makeSnapshot();
  saveSnapshot(snap);
  expect(loadSnapshot(snap.id)).not.toBeNull();
  const result = deleteSnapshot(snap.id);
  expect(result).toBe(true);
  expect(loadSnapshot(snap.id)).toBeNull();
});

test('deleteSnapshot returns false for missing id', () => {
  expect(deleteSnapshot('ghost-id')).toBe(false);
});
