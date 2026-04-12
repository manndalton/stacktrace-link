import { explainFrame, explainStackTrace } from './explain';
import type { StackFrame } from './parser';

function makeFrame(overrides: Partial<StackFrame> = {}): StackFrame {
  return {
    file: '/home/user/project/src/app.ts',
    line: 10,
    column: 5,
    fn: 'myFunction',
    raw: 'at myFunction (/home/user/project/src/app.ts:10:5)',
    ...overrides,
  };
}

describe('explainFrame', () => {
  it('includes function name in summary when present', () => {
    const frame = makeFrame({ fn: 'doSomething' });
    const result = explainFrame(frame);
    expect(result.summary).toContain('doSomething');
  });

  it('omits function name in summary when absent', () => {
    const frame = makeFrame({ fn: undefined });
    const result = explainFrame(frame);
    expect(result.summary).not.toContain('undefined');
    expect(result.summary).toContain('src/app.ts');
  });

  it('suggests opening the file for user frames', () => {
    const frame = makeFrame();
    const result = explainFrame(frame);
    expect(result.suggestions.some(s => s.includes('editor'))).toBe(true);
  });

  it('notes node_modules frames as dependencies', () => {
    const frame = makeFrame({ file: '/project/node_modules/express/index.js' });
    const result = explainFrame(frame);
    expect(result.suggestions.some(s => s.includes('dependency'))).toBe(true);
  });

  it('warns about column 1 as possible source-map issue', () => {
    const frame = makeFrame({ column: 1 });
    const result = explainFrame(frame);
    expect(result.suggestions.some(s => s.includes('source-map'))).toBe(true);
  });
});

describe('explainStackTrace', () => {
  it('returns the correct error type and message', () => {
    const frames = [makeFrame()];
    const result = explainStackTrace('TypeError', 'Cannot read property', frames);
    expect(result.errorType).toBe('TypeError');
    expect(result.errorMessage).toBe('Cannot read property');
  });

  it('provides a known tip for TypeError', () => {
    const result = explainStackTrace('TypeError', 'x', [makeFrame()]);
    expect(result.tip).toContain('null/undefined');
  });

  it('falls back to generic tip for unknown error type', () => {
    const result = explainStackTrace('CustomError', 'oops', [makeFrame()]);
    expect(result.tip).toContain('call stack');
  });

  it('produces one explanation per frame', () => {
    const frames = [makeFrame(), makeFrame({ line: 20 })];
    const result = explainStackTrace('Error', 'msg', frames);
    expect(result.explanations).toHaveLength(2);
  });
});
