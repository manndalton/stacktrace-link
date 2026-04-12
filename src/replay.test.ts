import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadReplays,
  saveReplays,
  addReplay,
  removeReplay,
  findReplay,
  clearReplays,
  getReplayDir,
} from './replay';

const origHome = os.homedir;

beforeEach(() => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'replay-test-'));
  (os as any).homedir = () => tmp;
});

afterEach(() => {
  (os as any).homedir = origHome;
});

test('loadReplays returns empty array when no file exists', () => {
  expect(loadReplays()).toEqual([]);
});

test('addReplay saves and returns entry', () => {
  const entry = addReplay('Error: boom\n  at foo (index.js:1:1)', 'test label');
  expect(entry.label).toBe('test label');
  expect(entry.input).toContain('Error: boom');
  expect(entry.id).toBeTruthy();
  const all = loadReplays();
  expect(all).toHaveLength(1);
  expect(all[0].id).toBe(entry.id);
});

test('addReplay without label', () => {
  const entry = addReplay('trace data');
  expect(entry.label).toBeUndefined();
});

test('findReplay returns correct entry', () => {
  const e1 = addReplay('trace1');
  addReplay('trace2');
  const found = findReplay(e1.id);
  expect(found?.input).toBe('trace1');
});

test('findReplay returns undefined for unknown id', () => {
  expect(findReplay('nope')).toBeUndefined();
});

test('removeReplay removes entry by id', () => {
  const e = addReplay('to remove');
  const removed = removeReplay(e.id);
  expect(removed).toBe(true);
  expect(loadReplays()).toHaveLength(0);
});

test('removeReplay returns false for unknown id', () => {
  expect(removeReplay('ghost')).toBe(false);
});

test('clearReplays empties the list', () => {
  addReplay('a');
  addReplay('b');
  clearReplays();
  expect(loadReplays()).toEqual([]);
});
