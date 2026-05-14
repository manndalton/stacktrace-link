import { countFrames, formatCountResult } from './count';
import { StackFrame } from './parser';

function makeFrame(overrides: Partial<StackFrame> = {}): StackFrame {
  return {
    function: 'anonymous',
    file: '/project/src/app.ts',
    line: 1,
    column: 1,
    ...overrides,
  };
}

describe('countFrames', () => {
  it('returns zeroes for empty input', () => {
    const result = countFrames([]);
    expect(result.total).toBe(0);
    expect(result.userFrames).toBe(0);
    expect(result.nodeModules).toBe(0);
    expect(result.internal).toBe(0);
  });

  it('counts user frames correctly', () => {
    const frames = [makeFrame(), makeFrame({ file: '/project/src/other.ts' })];
    const result = countFrames(frames);
    expect(result.total).toBe(2);
    expect(result.userFrames).toBe(2);
  });

  it('counts node_modules frames', () => {
    const frames = [makeFrame({ file: '/project/node_modules/express/index.js' })];
    const result = countFrames(frames);
    expect(result.nodeModules).toBe(1);
    expect(result.userFrames).toBe(0);
  });

  it('counts internal node: frames', () => {
    const frames = [makeFrame({ file: 'node:fs' })];
    const result = countFrames(frames);
    expect(result.internal).toBe(1);
  });

  it('counts frames with no file as internal', () => {
    const frames = [makeFrame({ file: undefined })];
    const result = countFrames(frames);
    expect(result.internal).toBe(1);
  });

  it('aggregates byFile counts', () => {
    const frames = [makeFrame(), makeFrame(), makeFrame({ file: '/other.ts' })];
    const result = countFrames(frames);
    expect(result.byFile['/project/src/app.ts']).toBe(2);
    expect(result.byFile['/other.ts']).toBe(1);
  });

  it('aggregates byFunction counts', () => {
    const frames = [makeFrame({ function: 'foo' }), makeFrame({ function: 'foo' })];
    const result = countFrames(frames);
    expect(result.byFunction['foo']).toBe(2);
  });
});

describe('formatCountResult', () => {
  it('includes totals in output', () => {
    const result = countFrames([makeFrame()]);
    const output = formatCountResult(result);
    expect(output).toContain('Total frames');
    expect(output).toContain('User frames');
  });

  it('lists top files', () => {
    const frames = [makeFrame(), makeFrame()];
    const output = formatCountResult(countFrames(frames));
    expect(output).toContain('Top files');
    expect(output).toContain('/project/src/app.ts');
  });
});
