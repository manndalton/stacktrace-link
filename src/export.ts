import * as fs from 'fs';
import * as path from 'path';
import { StackFrame } from './parser';
import { formatFrame } from './formatter';

export type ExportFormat = 'json' | 'csv' | 'markdown' | 'text';

export interface ExportOptions {
  format: ExportFormat;
  outputPath?: string;
  includeMetadata?: boolean;
}

export interface ExportResult {
  content: string;
  format: ExportFormat;
  frameCount: number;
}

export function exportToJson(frames: StackFrame[], includeMetadata = false): string {
  const data = includeMetadata
    ? { exportedAt: new Date().toISOString(), frameCount: frames.length, frames }
    : frames;
  return JSON.stringify(data, null, 2);
}

export function exportToCsv(frames: StackFrame[]): string {
  const header = 'file,line,column,function';
  const rows = frames.map(f =>
    [f.file, f.line, f.column ?? '', f.fn ?? ''].map(v => JSON.stringify(String(v ?? ''))).join(',')
  );
  return [header, ...rows].join('\n');
}

export function exportToMarkdown(frames: StackFrame[]): string {
  const lines = ['# Stack Trace', '', '| # | Function | File | Line |', '|---|----------|------|------|'];
  frames.forEach((f, i) => {
    lines.push(`| ${i + 1} | ${f.fn ?? '(anonymous)'} | ${f.file} | ${f.line} |`);
  });
  return lines.join('\n');
}

export function exportToText(frames: StackFrame[]): string {
  return frames.map(formatFrame).join('\n');
}

export function exportFrames(frames: StackFrame[], options: ExportOptions): ExportResult {
  let content: string;
  switch (options.format) {
    case 'json': content = exportToJson(frames, options.includeMetadata); break;
    case 'csv': content = exportToCsv(frames); break;
    case 'markdown': content = exportToMarkdown(frames); break;
    default: content = exportToText(frames);
  }
  if (options.outputPath) {
    fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });
    fs.writeFileSync(options.outputPath, content, 'utf8');
  }
  return { content, format: options.format, frameCount: frames.length };
}
