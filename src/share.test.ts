import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  generateShareId,
  saveShare,
  loadShare,
  listShares,
  deleteShare,
  exportShareText,
  getShareDir,
} from './share';
import { StackFrame } from './parser';

const frames: StackFrame[] = [
  { file: '/app/src/index.ts', line: 10, column: 5, fn: 'main', raw: 'at main (/app/src/index.ts:10:5)' },
];
const rawTrace = 'Error: boom\n    at main (/app/src/index.ts:10:5)';

let origHome: string;
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'share-test-'));
  origHome = os.homedir();
  jest.spyOn(os, 'homedir').mockReturnValue(tmpDir);
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('generateShareId returns non-empty string', () => {
  const id = generateShareId();
  expect(typeof id).toBe('string');
  expect(id.length).toBeGreaterThan(4);
});

test('saveShare writes file and returns payload', () => {
  const payload = saveShare(frames, rawTrace, 'my share');
  expect(payload.title).toBe('my share');
  expect(payload.frames).toEqual(frames);
  expect(payload.rawTrace).toBe(rawTrace);
  const file = path.join(getShareDir(), `${payload.id}.json`);
  expect(fs.existsSync(file)).toBe(true);
});

test('loadShare returns null for unknown id', () => {
  saveShare(frames, rawTrace);
  expect(loadShare('nonexistent')).toBeNull();
});

test('loadShare returns saved payload', () => {
  const saved = saveShare(frames, rawTrace, 'test');
  const loaded = loadShare(saved.id);
  expect(loaded).not.toBeNull();
  expect(loaded!.id).toBe(saved.id);
  expect(loaded!.title).toBe('test');
});

test('listShares returns all saved shares sorted newest first', () => {
  saveShare(frames, rawTrace, 'first');
  saveShare(frames, rawTrace, 'second');
  const list = listShares();
  expect(list.length).toBe(2);
});

test('deleteShare removes file and returns true', () => {
  const payload = saveShare(frames, rawTrace);
  expect(deleteShare(payload.id)).toBe(true);
  expect(loadShare(payload.id)).toBeNull();
});

test('deleteShare returns false for unknown id', () => {
  expect(deleteShare('ghost')).toBe(false);
});

test('exportShareText contains id and raw trace', () => {
  const payload = saveShare(frames, rawTrace, 'export test');
  const text = exportShareText(payload);
  expect(text).toContain(payload.id);
  expect(text).toContain(rawTrace);
  expect(text).toContain('export test');
});
