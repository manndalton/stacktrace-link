import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getNotesPath, loadNotes, saveNotes, addNote,
  removeNote, getNotesForFrame, updateNote
} from './note';

const ORIG = process.env.HOME;

beforeEach(() => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'note-test-'));
  process.env.HOME = tmp;
  const dir = path.join(tmp, '.stacktrace-link');
  fs.mkdirSync(dir, { recursive: true });
});

afterEach(() => {
  process.env.HOME = ORIG;
});

test('getNotesPath returns path under home', () => {
  expect(getNotesPath()).toContain('.stacktrace-link');
  expect(getNotesPath()).toContain('notes.json');
});

test('loadNotes returns empty object when file missing', () => {
  expect(loadNotes()).toEqual({});
});

test('saveNotes and loadNotes round-trip', () => {
  const data = { 'src/foo.ts:10': [{ id: '1', frameKey: 'src/foo.ts:10', text: 'hi', createdAt: '', updatedAt: '' }] };
  saveNotes(data);
  expect(loadNotes()).toEqual(data);
});

test('addNote creates a new note entry', () => {
  const note = addNote('src/bar.ts:20', 'check this');
  expect(note.frameKey).toBe('src/bar.ts:20');
  expect(note.text).toBe('check this');
  expect(note.id).toBeTruthy();
  const notes = getNotesForFrame('src/bar.ts:20');
  expect(notes).toHaveLength(1);
  expect(notes[0].text).toBe('check this');
});

test('addNote appends multiple notes for same frame', () => {
  addNote('src/x.ts:5', 'first');
  addNote('src/x.ts:5', 'second');
  expect(getNotesForFrame('src/x.ts:5')).toHaveLength(2);
});

test('removeNote removes by id and returns true', () => {
  const n = addNote('src/a.ts:1', 'delete me');
  expect(removeNote('src/a.ts:1', n.id)).toBe(true);
  expect(getNotesForFrame('src/a.ts:1')).toHaveLength(0);
});

test('removeNote returns false for unknown id', () => {
  expect(removeNote('src/a.ts:1', 'nope')).toBe(false);
});

test('updateNote changes text and updatedAt', () => {
  const n = addNote('src/b.ts:3', 'original');
  const updated = updateNote('src/b.ts:3', n.id, 'changed');
  expect(updated).not.toBeNull();
  expect(updated!.text).toBe('changed');
  expect(updated!.updatedAt).not.toBe(n.createdAt);
});

test('updateNote returns null for missing frame', () => {
  expect(updateNote('src/missing.ts:1', 'fake-id', 'text')).toBeNull();
});
