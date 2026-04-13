import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { extractContext, formatHighlight, highlightFrame, readFileLines } from './highlight';

function makeTempFile(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'highlight-test-'));
  const file = path.join(dir, 'sample.ts');
  fs.writeFileSync(file, content, 'utf8');
  return file;
}

describe('readFileLines', () => {
  it('splits file into lines', () => {
    const file = makeTempFile('line1\nline2\nline3');
    expect(readFileLines(file)).toEqual(['line1', 'line2', 'line3']);
  });
});

describe('extractContext', () => {
  const lines = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

  it('returns lines around target', () => {
    const result = extractContext(lines, 4, 2);
    expect(result.map((h) => h.lineNumber)).toEqual([2, 3, 4, 5, 6]);
  });

  it('marks only the target line', () => {
    const result = extractContext(lines, 4, 2);
    const targets = result.filter((h) => h.isTarget);
    expect(targets).toHaveLength(1);
    expect(targets[0].lineNumber).toBe(4);
    expect(targets[0].content).toBe('d');
  });

  it('clamps to start of file', () => {
    const result = extractContext(lines, 1, 3);
    expect(result[0].lineNumber).toBe(1);
  });

  it('clamps to end of file', () => {
    const result = extractContext(lines, 7, 3);
    expect(result[result.length - 1].lineNumber).toBe(7);
  });
});

describe('formatHighlight', () => {
  it('prefixes target line with >', () => {
    const lines = [
      { lineNumber: 1, content: 'foo', isTarget: false },
      { lineNumber: 2, content: 'bar', isTarget: true },
    ];
    const output = formatHighlight(lines, false);
    expect(output).toContain('> 2 | bar');
    expect(output).toContain('  1 | foo');
  });

  it('applies color to target line when useColor is true', () => {
    const lines = [{ lineNumber: 1, content: 'x', isTarget: true }];
    const output = formatHighlight(lines, true);
    expect(output).toContain('\x1b[33m');
  });

  it('does not apply color when useColor is false', () => {
    const lines = [{ lineNumber: 1, content: 'x', isTarget: true }];
    const output = formatHighlight(lines, false);
    expect(output).not.toContain('\x1b[33m');
  });
});

describe('highlightFrame', () => {
  it('returns formatted snippet for valid file and line', () => {
    const file = makeTempFile('alpha\nbeta\ngamma\ndelta\nepsilon');
    const result = highlightFrame({ filePath: file, targetLine: 3, contextLines: 1 }, false);
    expect(result).not.toBeNull();
    expect(result).toContain('> 3 | gamma');
  });

  it('returns null for non-existent file', () => {
    const result = highlightFrame({ filePath: '/no/such/file.ts', targetLine: 1 });
    expect(result).toBeNull();
  });
});
