import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  parseSourceMapJson,
  parseInlineSourceMap,
  resolveSourceMapForFrame,
} from './sourcemap';
import { StackFrame } from './parser';

const SIMPLE_MAP = JSON.stringify({
  version: 3,
  sources: ['src/app.ts'],
  mappings: 'AAAA,SAAS',
});

const makeFrame = (overrides: Partial<StackFrame> = {}): StackFrame => ({
  raw: '    at doThing (dist/app.js:3:10)',
  file: 'dist/app.js',
  line: 1,
  column: 0,
  fn: 'doThing',
  ...overrides,
});

describe('parseSourceMapJson', () => {
  it('returns an index keyed by source file', () => {
    const index = parseSourceMapJson(SIMPLE_MAP);
    expect(Object.keys(index)).toContain('src/app.ts');
  });

  it('records at least one entry per source', () => {
    const index = parseSourceMapJson(SIMPLE_MAP);
    expect(index['src/app.ts'].length).toBeGreaterThan(0);
  });

  it('throws on invalid json', () => {
    expect(() => parseSourceMapJson('not json')).toThrow();
  });
});

describe('parseInlineSourceMap', () => {
  it('returns null when no sourceMappingURL comment', () => {
    expect(parseInlineSourceMap('const x = 1;')).toBeNull();
  });

  it('parses a valid base64-encoded inline map', () => {
    const encoded = Buffer.from(SIMPLE_MAP).toString('base64');
    const content = `const x = 1;\n//# sourceMappingURL=data:application/json;base64,${encoded}`;
    const index = parseInlineSourceMap(content);
    expect(index).not.toBeNull();
    expect(Object.keys(index!)).toContain('src/app.ts');
  });
});

describe('resolveSourceMapForFrame', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'smap-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns original frame when no .map file exists', () => {
    const frame = makeFrame({ file: 'dist/app.js', line: 1 });
    const result = resolveSourceMapForFrame(frame, tmpDir);
    expect(result).toEqual(frame);
  });

  it('returns original frame when map file is malformed', () => {
    const jsFile = path.join(tmpDir, 'dist', 'app.js');
    fs.mkdirSync(path.dirname(jsFile), { recursive: true });
    fs.writeFileSync(jsFile + '.map', 'not valid json');
    const frame = makeFrame({ file: path.join(tmpDir, 'dist', 'app.js'), line: 1 });
    const result = resolveSourceMapForFrame(frame, tmpDir);
    expect(result).toEqual(frame);
  });

  it('resolves frame to original source when map matches line', () => {
    const distDir = path.join(tmpDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });
    const mapContent = JSON.stringify({
      version: 3,
      sources: ['../src/app.ts'],
      mappings: 'AAAA',
    });
    fs.writeFileSync(path.join(distDir, 'app.js.map'), mapContent);
    const frame = makeFrame({ file: path.join(distDir, 'app.js'), line: 1 });
    const result = resolveSourceMapForFrame(frame, tmpDir);
    expect(result.file).toContain('src/app.ts');
    expect(result.line).toBe(1);
  });
});
