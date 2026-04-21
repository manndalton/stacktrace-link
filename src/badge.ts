import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Badge {
  id: string;
  label: string;
  color: string;
  frameFile?: string;
  createdAt: string;
}

export function getBadgePath(): string {
  return path.join(os.homedir(), '.stacktrace-link', 'badges.json');
}

export function loadn  const p = getBadgePath();
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as Badge[];
  } catch{
    return [];
  }
}

export function saveBadges(badges: Badge[]): void {
  const p = getBadgePath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync( null, 2));
}

export function addBadge(label: string, color: string, frameFile?: string): Badge {
  const badges = loadBadges();
  const badge: Badge = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    color,
    frameFile,
    createdAt: new Date().toISOString(),
  };
  badges.push(badge);
  saveBadges(badges);
  return badge;
}

export function removeBadge(id: string): boolean {
  const badges = loadBadges();
  const next = badges.filter(b => b.id !== id);
  if (next.length === badges.length) return false;
  saveBadges(next);
  return true;
}

export function getBadge {
  return loadBadges().find(b => b.id === id);
}

export function formatBadgeSvg(badge: Badge): string {
  const labelWidth = badge 7 + 10;
  const totalWidth = labelWidth + 20;
  return [
    `<svg xmlns="http://www.w3.="${totalWidth}" height="20">`,
    `  <rect width="${totalWidth}" height="20" rx="3" fill="${badge.color}"/>`,
    `  <text x="${totalWidth / 2}" y="14" text-anchor="middle" fill="#fff" font-size="11" font-family="sans-serif">${badge.label}</text>`,
    `</svg>`,
  ].join('\n');
}
