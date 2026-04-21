import fs from 'fs';
import path from 'path';
import { StackFrame } from './parser';

export interface SourceMapEntry {
  generatedLine: number;
  generatedColumn: number;
  originalFile: string;
  originalLine: number;
  originalColumn: number;
}

export interface SourceMapIndex {
  [generatedFile: string]: SourceMapEntry[];
}

export function parseInlineSourceMap(fileContent: string): SourceMapIndex | null {
  const match = fileContent.match(
    /\/\/[#@]\s*sourceMappingURL=data:application\/json;base64,([A-Za-z0-9+/=]+)/
  );
  if (!match) return null;
  try {
    const decoded = Buffer.from(match[1], 'base64').toString('utf8');
    return parseSourceMapJson(decoded);
  } catch {
    return null;
  }
}

export function parseSourceMapJson(json: string): SourceMapIndex {
  const raw = JSON.parse(json);
  const sources: string[] = raw.sources || [];
  const mappings: string = raw.mappings || '';
  const index: SourceMapIndex = {};
  const groups = mappings.split(';');
  groups.forEach((group, lineIdx) => {
    const segments = group.split(',').filter(Boolean);
    segments.forEach((seg) => {
      const fields = decodeVlq(seg);
      if (fields.length >= 4) {
        const sourceIdx = fields[1];
        const originalFile = sources[sourceIdx] || '';
        const entry: SourceMapEntry = {
          generatedLine: lineIdx + 1,
          generatedColumn: fields[0],
          originalFile,
          originalLine: fields[2] + 1,
          originalColumn: fields[3],
        };
        if (!index[originalFile]) index[originalFile] = [];
        index[originalFile].push(entry);
      }
    });
  });
  return index;
}

export function resolveSourceMapForFrame(
  frame: StackFrame,
  projectRoot: string
): StackFrame {
  if (!frame.file) return frame;
  const absPath = path.isAbsolute(frame.file)
    ? frame.file
    : path.join(projectRoot, frame.file);
  const mapPath = absPath + '.map';
  if (!fs.existsSync(mapPath)) return frame;
  try {
    const mapJson = fs.readFileSync(mapPath, 'utf8');
    const index = parseSourceMapJson(mapJson);
    for (const [origFile, entries] of Object.entries(index)) {
      const match = entries.find(
        (e) => e.generatedLine === frame.line
      );
      if (match) {
        return {
          ...frame,
          file: path.resolve(path.dirname(absPath), origFile),
          line: match.originalLine,
          column: match.originalColumn,
        };
      }
    }
  } catch {
    // ignore unreadable maps
  }
  return frame;
}

function decodeVlq(segment: string): number[] {
  const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const result: number[] = [];
  let shift = 0;
  let value = 0;
  for (const char of segment) {
    const digit = BASE64.indexOf(char);
    const hasContinuation = digit & 0x20;
    value |= (digit & 0x1f) << shift;
    shift += 5;
    if (!hasContinuation) {
      result.push(value & 1 ? -(value >> 1) : value >> 1);
      shift = 0;
      value = 0;
    }
  }
  return result;
}
