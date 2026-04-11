import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Bookmark {
  id: string;
  label: string;
  file: string;
  line: number;
  column?: number;
  createdAt: string;
}

export function getBookmarkPath(): string {
  return path.join(os.homedir(), '.stacktrace-link', 'bookmarks.json');
}

export function loadBookmarks(): Bookmark[] {
  const filePath = getBookmarkPath();
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as Bookmark[];
  } catch {
    return [];
  }
}

export function saveBookmarks(bookmarks: Bookmark[]): void {
  const filePath = getBookmarkPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(bookmarks, null, 2), 'utf-8');
}

export function addBookmark(label: string, file: string, line: number, column?: number): Bookmark {
  const bookmarks = loadBookmarks();
  const entry: Bookmark = {
    id: Date.now().toString(36),
    label,
    file,
    line,
    column,
    createdAt: new Date().toISOString(),
  };
  bookmarks.push(entry);
  saveBookmarks(bookmarks);
  return entry;
}

export function removeBookmark(id: string): boolean {
  const bookmarks = loadBookmarks();
  const next = bookmarks.filter((b) => b.id !== id);
  if (next.length === bookmarks.length) return false;
  saveBookmarks(next);
  return true;
}

export function findBookmark(id: string): Bookmark | undefined {
  return loadBookmarks().find((b) => b.id === id);
}
