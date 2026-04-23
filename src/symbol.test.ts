import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { extractSymbols, findSymbol, buildSymbolMap, formatSymbol } from './symbol';

function makeTempFile(content: string, ext = '.ts'): string {
  const p = path.join(os.tmpdir(), `sym-test-${Date.now()}${ext}`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

const SAMPLE = `
export function doSomething() {}
export class MyClass {}
const arrowFn = async (x: number) => x * 2;
export async function fetchData() {}
`;

test('extractSymbols finds functions', () => {
  const f = makeTempFile(SAMPLE);
  const syms = extractSymbols(f);
  const names = syms.map(s => s.name);
  expect(names).toContain('doSomething');
  expect(names).toContain('fetchData');
  fs.unlinkSync(f);
});

test('extractSymbols finds classes', () => {
  const f = makeTempFile(SAMPLE);
  const syms = extractSymbols(f);
  const cls = syms.find(s => s.kind === 'class');
  expect(cls).toBeDefined();
  expect(cls!.name).toBe('MyClass');
  fs.unlinkSync(f);
});

test('extractSymbols finds arrow functions', () => {
  const f = makeTempFile(SAMPLE);
  const syms = extractSymbols(f);
  const arrow = syms.find(s => s.kind === 'arrow');
  expect(arrow).toBeDefined();
  expect(arrow!.name).toBe('arrowFn');
  fs.unlinkSync(f);
});

test('extractSymbols returns empty for missing file', () => {
  expect(extractSymbols('/nonexistent/file.ts')).toEqual([]);
});

test('findSymbol returns correct entry', () => {
  const f = makeTempFile(SAMPLE);
  const syms = extractSymbols(f);
  const sym = findSymbol(syms, 'doSomething');
  expect(sym).toBeDefined();
  expect(sym!.kind).toBe('function');
  fs.unlinkSync(f);
});

test('findSymbol returns undefined for unknown name', () => {
  const f = makeTempFile(SAMPLE);
  const syms = extractSymbols(f);
  expect(findSymbol(syms, 'nope')).toBeUndefined();
  fs.unlinkSync(f);
});

test('buildSymbolMap keys by name', () => {
  const f = makeTempFile(SAMPLE);
  const syms = extractSymbols(f);
  const map = buildSymbolMap(syms);
  expect(map['doSomething']).toBeDefined();
  expect(map['MyClass'].kind).toBe('class');
  fs.unlinkSync(f);
});

test('formatSymbol includes name and line', () => {
  const f = makeTempFile(SAMPLE);
  const syms = extractSymbols(f);
  const sym = findSymbol(syms, 'doSomething')!;
  const out = formatSymbol(sym);
  expect(out).toContain('doSomething');
  expect(out).toMatch(/:\d+/);
  fs.unlinkSync(f);
});
