import {
  truncateFrames,
  truncateLine,
  truncateFilePath,
  formatTruncationNotice,
} from './truncate';
import { StackFrame } from './parser';

function makeFrame(file: string, line: number): StackFrame {
  return { file, line, column: 1, fn: 'fn', raw: `at fn (${file}:${line}:1)` };
}

describe('truncateFrames', () => {
  it('returns all frames when under limit', () => {
    const frames = [makeFrame('a.ts', 1), makeFrame('b.ts', 2)];
    const result = truncateFrames(frames, { maxFrames: 5 });
    expect(result.frames).toHaveLength(2);
    expect(result.truncated).toBe(0);
  });

  it('truncates frames over limit', () => {
    const frames = Array.from({ length: 15 }, (_, i) => makeFrame(`f${i}.ts`, i));
    const result = truncateFrames(frames, { maxFrames: 10 });
    expect(result.frames).toHaveLength(10);
    expect(result.truncated).toBe(5);
  });

  it('uses default maxFrames of 10', () => {
    const frames = Array.from({ length: 12 }, (_, i) => makeFrame(`f${i}.ts`, i));
    const result = truncateFrames(frames);
    expect(result.frames).toHaveLength(10);
    expect(result.truncated).toBe(2);
  });
});

describe('truncateLine', () => {
  it('returns short lines unchanged', () => {
    expect(truncateLine('short line')).toBe('short line');
  });

  it('truncates long lines with ellipsis', () => {
    const long = 'a'.repeat(130);
    const result = truncateLine(long, { maxLineLength: 120 });
    expect(result).toHaveLength(120);
    expect(result.endsWith('...')).toBe(true);
  });

  it('respects custom ellipsis', () => {
    const long = 'b'.repeat(50);
    const result = truncateLine(long, { maxLineLength: 20, ellipsis: '…' });
    expect(result).toHaveLength(20);
    expect(result.endsWith('…')).toBe(true);
  });
});

describe('truncateFilePath', () => {
  it('returns short paths unchanged', () => {
    expect(truncateFilePath('/a/b/c.ts', 4)).toBe('/a/b/c.ts');
  });

  it('shortens deep paths', () => {
    const result = truncateFilePath('/a/b/c/d/e/f.ts', 4);
    expect(result.startsWith('...')).toBe(true);
    expect(result).toContain('f.ts');
  });
});

describe('formatTruncationNotice', () => {
  it('uses singular for 1 frame', () => {
    expect(formatTruncationNotice(1)).toContain('1 more frame omitted');
  });

  it('uses plural for multiple frames', () => {
    expect(formatTruncationNotice(5)).toContain('5 more frames omitted');
  });
});
