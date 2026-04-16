import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface PinnedFrame {
  id: string;
  label: string;
  file: string;
  line: number;
  column?: number;
  createdAt: string;
}

export function getPinsPath(): string {
  return path.join(os.homedir(), '.stacktrace-link', 'pins.json');
}

export function loadPins(): PinnedFrame[] {
  const p = getPinsPath();
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return [];
  }
}

export function savePins(pins: PinnedFrame[]): void {
  const p = getPinsPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(pins, null, 2));
}

export function addPin(label: string, file: string, line: number, column?: number): PinnedFrame {
  const pins = loadPins();
  const pin: PinnedFrame = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    file,
    line,
    column,
    createdAt: new Date().toISOString(),
  };
  pins.push(pin);
  savePins(pins);
  return pin;
}

export function removePin(id: string): boolean {
  const pins = loadPins();
  const next = pins.filter(p => p.id !== id);
  if (next.length === pins.length) return false;
  savePins(next);
  return true;
}

export function findPin(id: string): PinnedFrame | undefined {
  return loadPins().find(p => p.id === id);
}

export function clearPins(): void {
  savePins([]);
}
