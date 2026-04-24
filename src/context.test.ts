import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  extractFrameContext,
  formatFrameContext,
  contextSummary,
  readFileSync,
} from './context';

function makeTempFile(content: string): string {
  const p = path.join(os.tmpdir(), `ctx-test-${Date.now()}.ts`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

const SAMPLE = [
  'function foo() {',
  '  const x = 1;',
  '  return x + 2;',
  '}',
  '',
  'function bar() {',
  '  throw new Error("oops");',
  '}',
].join('\n');

let tmpFile: string;
beforeAll(() => { tmpFile = makeTempFile(SAMPLE); });
afterAll(() => { try { fs.unlinkSync(tmpFile); } catch {} });

describe('readFileSync', () => {
  it('returns lines for a valid file', () => {
    const lines = readFileSync(tmpFile);
    expect(lines.length).toBe(8);
  });

  it('returns empty array for missing file', () => {
    expect(readFileSync('/nonexistent/file.ts')).toEqual([]);
  });
});

describe('extractFrameContext', () => {
  it('returns context around the target line', () => {
    const ctx = extractFrameContext(tmpFile, 3, 2);
    expect(ctx).not.toBeNull();
    expect(ctx!.target).toBe('  return x + 2;');
    expect(ctx!.before.length).toBe(2);
    expect(ctx!.after.length).toBe(2);
  });

  it('returns null for out-of-range line', () => {
    expect(extractFrameContext(tmpFile, 999)).toBeNull();
  });

  it('returns null for missing file', () => {
    expect(extractFrameContext('/no/file.ts', 1)).toBeNull();
  });

  it('clamps context at file boundaries', () => {
    const ctx = extractFrameContext(tmpFile, 1, 3);
    expect(ctx!.before).toEqual([]);
    expect(ctx!.after.length).toBe(3);
  });
});

describe('formatFrameContext', () => {
  it('marks target line with >', () => {
    const ctx = extractFrameContext(tmpFile, 7, 2)!;
    const out = formatFrameContext(ctx);
    expect(out).toContain('>');
    expect(out).toContain('throw new Error');
  });

  it('includes surrounding lines with |', () => {
    const ctx = extractFrameContext(tmpFile, 3, 1)!;
    const out = formatFrameContext(ctx);
    expect(out).toContain('|');
  });
});

describe('contextSummary', () => {
  it('returns a short summary string', () => {
    const ctx = extractFrameContext(tmpFile, 2, 1)!;
    const summary = contextSummary(ctx);
    expect(summary).toContain(':2');
    expect(summary).toContain('const x = 1');
  });
});
