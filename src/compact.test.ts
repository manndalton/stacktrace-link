import { compactFrame, compactFrames, formatCompact } from './compact';
import { StackFrame } from './parser';

function makeFrame(overrides: Partial<StackFrame> = {}): StackFrame {
  return {
    file: '/home/user/project/src/server.ts',
    line: 42,
    column: 7,
    function: 'handleRequest',
    raw: '',
    ...overrides,
  };
}

describe('compactFrame', () => {
  it('formats a frame with function and file', () => {
    const result = compactFrame(makeFrame());
    expect(result).toBe('handleRequest › /home/user/project/src/server.ts:42:7');
  });

  it('omits column when not present', () => {
    const result = compactFrame(makeFrame({ column: undefined }));
    expect(result).toBe('handleRequest › /home/user/project/src/server.ts:42');
  });

  it('uses anonymous for missing function', () => {
    const result = compactFrame(makeFrame({ function: undefined }));
    expect(result).toContain('<anonymous>');
  });

  it('respects showLineCol=false', () => {
    const result = compactFrame(makeFrame(), { showLineCol: false });
    expect(result).not.toContain(':42');
    expect(result).toContain('server.ts');
  });

  it('truncates long lines', () => {
    const result = compactFrame(makeFrame(), { maxLength: 30 });
    expect(result.length).toBeLessThanOrEqual(30);
    expect(result).toContain('...');
  });

  it('uses custom separator', () => {
    const result = compactFrame(makeFrame(), { separator: ' | ' });
    expect(result).toContain(' | ');
  });
});

describe('compactFrames', () => {
  it('maps multiple frames', () => {
    const frames = [makeFrame(), makeFrame({ line: 99, function: 'boot' })];
    const results = compactFrames(frames);
    expect(results).toHaveLength(2);
    expect(results[1]).toContain('boot');
  });
});

describe('formatCompact', () => {
  it('joins frames with newlines', () => {
    const frames = [makeFrame(), makeFrame({ line: 10 })];
    const out = formatCompact(frames);
    expect(out.split('\n')).toHaveLength(2);
  });
});
