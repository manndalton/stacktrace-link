import * as path from 'path';
import * as fs from 'fs';

export interface SymbolEntry {
  file: string;
  line: number;
  column: number;
  name: string;
  kind: 'function' | 'method' | 'class' | 'arrow' | 'unknown';
}

export interface SymbolMap {
  [key: string]: SymbolEntry;
}

const FUNCTION_RE = /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/;
const CLASS_RE = /^\s*(?:export\s+)?class\s+(\w+)/;
const METHOD_RE = /^\s*(?:async\s+)?(\w+)\s*\(/;
const ARROW_RE = /^\s*(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\(/;

export function extractSymbols(filePath: string): SymbolEntry[] {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const symbols: SymbolEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match: RegExpMatchArray | null;

    if ((match = line.match(FUNCTION_RE))) {
      symbols.push({ file: filePath, line: i + 1, column: 1, name: match[1], kind: 'function' });
    } else if ((match = line.match(CLASS_RE))) {
      symbols.push({ file: filePath, line: i + 1, column: 1, name: match[1], kind: 'class' });
    } else if ((match = line.match(ARROW_RE))) {
      symbols.push({ file: filePath, line: i + 1, column: 1, name: match[1], kind: 'arrow' });
    } else if ((match = line.match(METHOD_RE)) && !line.trimStart().startsWith('//')) {
      symbols.push({ file: filePath, line: i + 1, column: 1, name: match[1], kind: 'method' });
    }
  }

  return symbols;
}

export function findSymbol(symbols: SymbolEntry[], name: string): SymbolEntry | undefined {
  return symbols.find(s => s.name === name);
}

export function buildSymbolMap(symbols: SymbolEntry[]): SymbolMap {
  const map: SymbolMap = {};
  for (const sym of symbols) {
    map[sym.name] = sym;
  }
  return map;
}

export function formatSymbol(sym: SymbolEntry): string {
  const rel = path.relative(process.cwd(), sym.file);
  return `${sym.name} (${sym.kind}) — ${rel}:${sym.line}`;
}
