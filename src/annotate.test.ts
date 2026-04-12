import * as fs from 'fs';
import * as os * as path from 'path';
import {
  addAnnotation,
  removeAnnotation,
  listAnnotations,
  getAnnotationsForFrame,
  loadAnnotations,
} from './annotate';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'annotate-test-'));
  process.env.STACKTRACE_DATA_DIR = tmpDir;
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.STACKTRACE_DATA_DIR;
});

test('starts with empty annotations', () => {
  expect(listAnnotations()).toEqual([]);
});

test('addAnnotation persists an annotation', () => {
  const a = addAnnotation('/app/src/foo.ts', 10, 'null check missing');
  expect(a.file).toBe('/app/src/foo.ts');
  expect(a.line).toBe(10);
  expect(a.text).toBe('null check missing');
  expect(a.createdAt).toBeTruthy();
});

test('addAnnotation with author and col', () => {
  const a = addAnnotation('/app/src/bar.ts', 5, 'off by one', 3, 'alice');
  expect(a.author).toBe('alice');
  expect(a.col).toBe(3);
});

test('listAnnotations returns all stored annotations', () => {
  addAnnotation('/app/a.ts', 1, 'first');
  addAnnotation('/app/b.ts', 2, 'second');
  expect(listAnnotations()).toHaveLength(2);
});

test('removeAnnotation removes matching entry', () => {
  addAnnotation('/app/src/foo.ts', 10, 'test');
  const removed = removeAnnotation('/app/src/foo.ts', 10);
  expect(removed).toBe(true);
  expect(listAnnotations()).toHaveLength(0);
});

test('removeAnnotation returns false when not found', () => {
  const removed = removeAnnotation('/no/such/file.ts', 99);
  expect(removed).toBe(false);
});

test('getAnnotationsForFrame returns matching annotations', () => {
  addAnnotation('/app/src/foo.ts', 10, 'relevant');
  addAnnotation('/app/src/bar.ts', 20, 'irrelevant');
  const frame = { file: '/app/src/foo.ts', line: 10, col: 0, raw: '' };
  const results = getAnnotationsForFrame(frame);
  expect(results).toHaveLength(1);
  expect(results[0].text).toBe('relevant');
});

test('getAnnotationsForFrame returns empty array when no match', () => {
  addAnnotation('/app/src/foo.ts', 10, 'note');
  const frame = { file: '/app/src/other.ts', line: 10, col: 0, raw: '' };
  expect(getAnnotationsForFrame(frame)).toEqual([]);
});

test('loadAnnotations handles corrupt file gracefully', () => {
  const p = path.join(tmpDir, 'annotations.json');
  fs.writeFileSync(p, 'not json');
  expect(loadAnnotations()).toEqual({ annotations: [] });
});
