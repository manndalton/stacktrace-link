import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Note {
  id: string;
  frameKey: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export type NotesMap = Record<string, Note[]>;

export function getNotesPath(): string {
  return path.join(os.homedir(), '.stacktrace-link', 'notes.json');
}

export function loadNotes(): NotesMap {
  const p = getNotesPath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as NotesMap;
  } catch {
    return {};
  }
}

export function saveNotes(notes: NotesMap): void {
  const p = getNotesPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(notes, null, 2), 'utf8');
}

export function addNote(frameKey: string, text: string): Note {
  const notes = loadNotes();
  const now = new Date().toISOString();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const note: Note = { id, frameKey, text, createdAt: now, updatedAt: now };
  if (!notes[frameKey]) notes[frameKey] = [];
  notes[frameKey].push(note);
  saveNotes(notes);
  return note;
}

export function removeNote(frameKey: string, id: string): boolean {
  const notes = loadNotes();
  const list = notes[frameKey];
  if (!list) return false;
  const idx = list.findIndex(n => n.id === id);
  if (idx === -1) return false;
  list.splice(idx, 1);
  if (list.length === 0) delete notes[frameKey];
  saveNotes(notes);
  return true;
}

export function getNotesForFrame(frameKey: string): Note[] {
  const notes = loadNotes();
  return notes[frameKey] ?? [];
}

export function updateNote(frameKey: string, id: string, text: string): Note | null {
  const notes = loadNotes();
  const list = notes[frameKey];
  if (!list) return null;
  const note = list.find(n => n.id === id);
  if (!note) return null;
  note.text = text;
  note.updatedAt = new Date().toISOString();
  saveNotes(notes);
  return note;
}
