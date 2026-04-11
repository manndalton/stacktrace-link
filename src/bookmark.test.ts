import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getBookmarkPath,
  loadBookmarks,
  saveBookmarks,
  addBookmark,
  removeBookmark,
  findBookmark,
} from './bookmark';

const testDir = path.join(os.tmpdir(), 'stl-bookmark-test-' + process.pid);
const testFile = path.join(testDir, 'bookmarks.json');

beforeEach(() => {
  fs.mkdirSync(testDir, { recursive: true });
  if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  jest.spyOn(os, 'homedir').mockReturnValue(testDir.replace('/.stacktrace-link', ''));
  jest.spyOn(path, 'join').mockImplementation((...args) => {
    if (args[1] === '.stacktrace-link' && args[2] === 'bookmarks.json') return testFile;
    return jest.requireActual('path').join(...args);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
});

test('loadBookmarks returns empty array when file missing', () => {
  expect(loadBookmarks()).toEqual([]);
});

test('saveBookmarks and loadBookmarks round-trip', () => {
  const bm = [{ id: 'abc', label: 'Test', file: 'src/foo.ts', line: 10, createdAt: new Date().toISOString() }];
  saveBookmarks(bm);
  expect(loadBookmarks()).toEqual(bm);
});

test('addBookmark appends entry and returns it', () => {
  const entry = addBookmark('My Label', 'src/bar.ts', 42, 7);
  expect(entry.label).toBe('My Label');
  expect(entry.file).toBe('src/bar.ts');
  expect(entry.line).toBe(42);
  expect(entry.column).toBe(7);
  expect(entry.id).toBeTruthy();
  const all = loadBookmarks();
  expect(all).toHaveLength(1);
  expect(all[0].id).toBe(entry.id);
});

test('removeBookmark removes existing entry', () => {
  const entry = addBookmark('To Remove', 'src/baz.ts', 5);
  const result = removeBookmark(entry.id);
  expect(result).toBe(true);
  expect(loadBookmarks()).toHaveLength(0);
});

test('removeBookmark returns false for unknown id', () => {
  expect(removeBookmark('nonexistent')).toBe(false);
});

test('findBookmark returns correct entry', () => {
  const entry = addBookmark('Find Me', 'src/qux.ts', 99);
  const found = findBookmark(entry.id);
  expect(found).toBeDefined();
  expect(found!.label).toBe('Find Me');
});

test('findBookmark returns undefined for unknown id', () => {
  expect(findBookmark('unknown')).toBeUndefined();
});
