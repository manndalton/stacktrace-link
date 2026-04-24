import * as fs from 'fs';
import * as path from 'path';

export interface FrameContext {
  file: string;
  line: number;
  column?: number;
  before: string[];
  target: string;
  after: string[];
  contextLines: number;
}

export function readFileSync(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n');
  } catch {
    return [];
  }
}

export function extractFrameContext(
  file: string,
  line: number,
  contextLines = 3
): FrameContext | null {
  const lines = readFileSync(file);
  if (!lines.length) return null;

  const idx = line - 1;
  if (idx < 0 || idx >= lines.length) return null;

  const start = Math.max(0, idx - contextLines);
  const end = Math.min(lines.length - 1, idx + contextLines);

  return {
    file,
    line,
    before: lines.slice(start, idx),
    target: lines[idx],
    after: lines.slice(idx + 1, end + 1),
    contextLines,
  };
}

export function formatFrameContext(ctx: FrameContext): string {
  const startLine = ctx.line - ctx.before.length;
  const lines: string[] = [];

  ctx.before.forEach((l, i) => {
    const n = String(startLine + i).padStart(4);
    lines.push(`${n} | ${l}`);
  });

  const targetNum = String(ctx.line).padStart(4);
  lines.push(`${targetNum} > ${ctx.target}`);

  ctx.after.forEach((l, i) => {
    const n = String(ctx.line + 1 + i).padStart(4);
    lines.push(`${n} | ${l}`);
  });

  return lines.join('\n');
}

export function contextSummary(ctx: FrameContext): string {
  const rel = path.relative(process.cwd(), ctx.file);
  return `${rel}:${ctx.line} — ${ctx.target.trim()}`;
}
