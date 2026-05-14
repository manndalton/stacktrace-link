import { describe, it, expect } from 'vitest';
import {
  maskFilePath,
  maskFunctionName,
  maskFrame,
  maskFrames,
  buildMaskOptions,
} from './mask';
import type { StackFrame } from './parser';

function makeFrame(overrides: Partial<StackFrame> = {}): StackFrame {
  return {
    file: '/home/user/project/src/app.ts',
    function: 'handleRequest',
    line: 42,
    column: 10,
    ...overrides,
  };
}

describe('maskFilePath', () => {
  it('replaces all path segments except the filename', () => {
    expect(maskFilePath('/home/user/project/src/app.ts', '***')).toBe('***/***/***/***/ app.ts'.replace(/ /g, ''));
  });

  it('handles a bare filename with no slashes', () => {
    expect(maskFilePath('app.ts', '***')).toBe('app.ts');
  });
});

describe('maskFunctionName', () => {
  it('returns placeholder for defined name', () => {
    expect(maskFunctionName('handleRequest', '***')).toBe('***');
  });

  it('returns placeholder for undefined name', () => {
    expect(maskFunctionName(undefined, '***')).toBe('***');
  });
});

describe('maskFrame', () => {
  it('masks file path when option is set', () => {
    const frame = makeFrame();
    const result = maskFrame(frame, { maskFilePaths: true });
    expect(result.file).not.toBe(frame.file);
    expect(result.file).toContain('app.ts');
  });

  it('masks function name when option is set', () => {
    const frame = makeFrame();
    const result = maskFrame(frame, { maskFunctionNames: true });
    expect(result.function).toBe('***');
  });

  it('masks line and column to 0 when option is set', () => {
    const frame = makeFrame();
    const result = maskFrame(frame, { maskLineNumbers: true });
    expect(result.line).toBe(0);
    expect(result.column).toBe(0);
  });

  it('leaves fields unchanged when no options set', () => {
    const frame = makeFrame();
    expect(maskFrame(frame, {})).toEqual(frame);
  });

  it('respects custom placeholder', () => {
    const frame = makeFrame();
    const result = maskFrame(frame, { maskFunctionNames: true, placeholder: '<hidden>' });
    expect(result.function).toBe('<hidden>');
  });
});

describe('maskFrames', () => {
  it('applies masking to all frames', () => {
    const frames = [makeFrame(), makeFrame({ function: 'other' })];
    const result = maskFrames(frames, { maskFunctionNames: true });
    expect(result.every(f => f.function === '***')).toBe(true);
  });
});

describe('buildMaskOptions', () => {
  it('parses long flags', () => {
    const opts = buildMaskOptions({ '--files': true, '--functions': true, '--lines': true });
    expect(opts.maskFilePaths).toBe(true);
    expect(opts.maskFunctionNames).toBe(true);
    expect(opts.maskLineNumbers).toBe(true);
  });

  it('uses default placeholder when not provided', () => {
    const opts = buildMaskOptions({});
    expect(opts.placeholder).toBe('***');
  });
});
