import * as fs from 'fs';
import * as path from 'path';

export interface PatchHunk {
  startLine: number;
  lines: string[];
}

export interface FilePatch {
  file: string;
  hunks: PatchHunk[];
}

export function parseUnifiedDiff(diff: string): FilePatch[] {
  const patches: FilePatch[] = [];
  let current: FilePatch | null = null;
  let hunk: PatchHunk | null = null;

  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ ')) {
      const file = line.slice(4).replace(/^b\//, '');
      current = { file, hunks: [] };
      patches.push(current);
    } else if (line.startsWith('@@ ')) {
      const m = line.match(/@@ -\d+(?:,\d+)? \+(\d+)/);
      if (m && current) {
        hunk = { startLine: parseInt(m[1], 10), lines: [] };
        current.hunks.push(hunk);
      }
    } else if (hunk && (line.startsWith('+') || line.startsWith(' '))) {
      hunk.lines.push(line.slice(1));
    }
  }

  return patches;
}

export function applyPatch(patch: FilePatch, basePath: string): void {
  const filePath = path.resolve(basePath, patch.file);
  const original = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, 'utf8').split('\n')
    : [];

  for (const hunk of patch.hunks) {
    const idx = hunk.startLine - 1;
    original.splice(idx, hunk.lines.length, ...hunk.lines);
  }

  fs.writeFileSync(filePath, original.join('\n'), 'utf8');
}

export function extractPatchForFrame(file: string, line: number, context = 2): string {
  if (!fs.existsSync(file)) return '';
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const start = Math.max(0, line - 1 - context);
  const end = Math.min(lines.length, line + context);
  const chunk = lines.slice(start, end);
  return chunk.map((l, i) => `${start + i + 1}: ${l}`).join('\n');
}
