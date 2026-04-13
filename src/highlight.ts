import * as fs from 'fs';

export interface HighlightedLine {
  lineNumber: number;
  content: string;
  isTarget: boolean;
}

export interface HighlightContext {
  filePath: string;
  targetLine: number;
  contextLines?: number;
}

export function readFileLines(filePath: string): string[] {
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw.split('\n');
}

export function extractContext(
  lines: string[],
  targetLine: number,
  contextLines: number = 3
): HighlightedLine[] {
  const start = Math.max(0, targetLine - 1 - contextLines);
  const end = Math.min(lines.length - 1, targetLine - 1 + contextLines);
  const result: HighlightedLine[] = [];
  for (let i = start; i <= end; i++) {
    result.push({
      lineNumber: i + 1,
      content: lines[i] ?? '',
      isTarget: i + 1 === targetLine,
    });
  }
  return result;
}

export function formatHighlight(
  highlighted: HighlightedLine[],
  useColor: boolean = true
): string {
  const maxLineNum = Math.max(...highlighted.map((h) => h.lineNumber));
  const pad = String(maxLineNum).length;
  return highlighted
    .map((h) => {
      const lineNum = String(h.lineNumber).padStart(pad, ' ');
      const marker = h.isTarget ? '>' : ' ';
      const line = `${marker} ${lineNum} | ${h.content}`;
      if (useColor && h.isTarget) {
        return `\x1b[33m${line}\x1b[0m`;
      }
      return line;
    })
    .join('\n');
}

export function highlightFrame(ctx: HighlightContext, useColor: boolean = true): string | null {
  try {
    const lines = readFileLines(ctx.filePath);
    const highlighted = extractContext(lines, ctx.targetLine, ctx.contextLines ?? 3);
    return formatHighlight(highlighted, useColor);
  } catch {
    return null;
  }
}
