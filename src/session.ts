import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface SessionEntry {
  id: string;
  startedAt: string;
  frames: string[];
  editorCommand?: string;
}

export interface Session {
  entries: SessionEntry[];
}

const SESSION_FILE = path.join(os.homedir(), '.stacktrace-link', 'session.json');

export function getSessionPath(): string {
  return SESSION_FILE;
}

export function loadSession(): Session {
  try {
    const raw = fs.readFileSync(SESSION_FILE, 'utf8');
    return JSON.parse(raw) as Session;
  } catch {
    return { entries: [] };
  }
}

export function saveSession(session: Session): void {
  const dir = path.dirname(SESSION_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2), 'utf8');
}

export function addSessionEntry(entry: Omit<SessionEntry, 'id' | 'startedAt'>): SessionEntry {
  const session = loadSession();
  const newEntry: SessionEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    startedAt: new Date().toISOString(),
    ...entry,
  };
  session.entries.push(newEntry);
  saveSession(session);
  return newEntry;
}

export function clearSession(): void {
  saveSession({ entries: [] });
}

export function getSessionEntry(id: string): SessionEntry | undefined {
  const session = loadSession();
  return session.entries.find((e) => e.id === id);
}
