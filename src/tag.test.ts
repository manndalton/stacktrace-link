import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadTags, saveTags, addTag, removeTag, getSnapshotsByTag, getTagsPath
} from './tag';

const ORIG_HOME = process.env.HOME;
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tag-test-'));
  process.env.HOME = tmpDir;
});

afterEach(() => {
  process.env.HOME = ORIG_HOME;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('loadTags returns empty object when file missing', () => {
  expect(loadTags()).toEqual({});
});

test('saveTags and loadTags round-trip', () => {
  const tags = {
    bug: { name: 'bug', snapshotIds: ['abc123'], createdAt: '2024-01-01T00:00:00.000Z' }
  };
  saveTags(tags);
  expect(loadTags()).toEqual(tags);
});

test('addTag creates a new tag with snapshotId', () => {
  addTag('feature', 'snap1');
  const tags = loadTags();
  expect(tags['feature']).toBeDefined();
  expect(tags['feature'].snapshotIds).toContain('snap1');
});

test('addTag does not duplicate snapshotIds', () => {
  addTag('feature', 'snap1');
  addTag('feature', 'snap1');
  const tags = loadTags();
  expect(tags['feature'].snapshotIds.length).toBe(1);
});

test('addTag appends multiple snapshots to same tag', () => {
  addTag('release', 'snap1');
  addTag('release', 'snap2');
  const ids = getSnapshotsByTag('release');
  expect(ids).toContain('snap1');
  expect(ids).toContain('snap2');
});

test('removeTag removes entire tag when no snapshotId given', () => {
  addTag('old', 'snap1');
  const result = removeTag('old');
  expect(result).toBe(true);
  expect(loadTags()['old']).toBeUndefined();
});

test('removeTag removes only specific snapshotId', () => {
  addTag('mixed', 'snap1');
  addTag('mixed', 'snap2');
  removeTag('mixed', 'snap1');
  const ids = getSnapshotsByTag('mixed');
  expect(ids).not.toContain('snap1');
  expect(ids).toContain('snap2');
});

test('removeTag returns false for nonexistent tag', () => {
  expect(removeTag('ghost')).toBe(false);
});

test('getSnapshotsByTag returns empty array for unknown tag', () => {
  expect(getSnapshotsByTag('nope')).toEqual([]);
});

test('getTagsPath includes tags.json', () => {
  expect(getTagsPath()).toMatch(/tags\.json$/);
});
