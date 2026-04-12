import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { StackFrame } from './parser';

export interface SharePayload {
  id: string;
  createdAt: string;
  title?: string;
  frames: StackFrame[];
  rawTrace: string;
}

export function getShareDir(): string {
  return path.join(os.homedir(), '.stacktrace-link', 'shares');
}

export function generateShareId(): string {
  return Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36);
}

export function saveShare(frames: StackFrame[], rawTrace: string, title?: string): SharePayload {
  const dir = getShareDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const payload: SharePayload = {
    id: generateShareId(),
    createdAt: new Date().toISOString(),
    title,
    frames,
    rawTrace,
  };
  const file = path.join(dir, `${payload.id}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

export function loadShare(id: string): SharePayload | null {
  const file = path.join(getShareDir(), `${id}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8')) as SharePayload;
}

export function listShares(): SharePayload[] {
  const dir = getShareDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as SharePayload)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function deleteShare(id: string): boolean {
  const file = path.join(getShareDir(), `${id}.json`);
  if (!fs.existsSync(file)) return false;
  fs.unlinkSync(file);
  return true;
}

export function exportShareText(payload: SharePayload): string {
  const lines: string[] = [
    `# Stack Trace Share: ${payload.id}`,
    `Created: ${payload.createdAt}`,
    payload.title ? `Title: ${payload.title}` : '',
    '',
    payload.rawTrace,
  ];
  return lines.filter(l => l !== undefined).join('\n');
}
