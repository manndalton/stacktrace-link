import { summarizeFrames, formatSummaryReport } from './summarize';
import { StackFrame } from './parser';

function makeFrame(file: string, line = 1, col = 1, fn = 'fn'): StackFrame {
  return { file, line, column: col, function: fn, raw: '' };
}

describe('summarizeFrames', () => {
  it('counts frames by category', () => {
    const frames = [
      makeFrame('/app/src/index.ts'),
      makeFrame('/app/src/utils.ts'),
      makeFrame('/app/node_modules/express/index.js'),
      makeFrame('node:internal/process/task_queues.js'),
      makeFrame('internal/bootstrap/node.js'),
    ];
    const s = summarizeFrames(frames);
    expect(s.totalFrames).toBe(5);
    expect(s.userFrames).toBe(2);
    expect(s.nodeModulesFrames).toBe(1);
    expect(s.internalFrames).toBe(2);
  });

  it('identifies topFile by frequency', () => {
    const frames = [
      makeFrame('/app/src/index.ts'),
      makeFrame('/app/src/index.ts'),
      makeFrame('/app/src/other.ts'),
    ];
    const s = summarizeFrames(frames);
    expect(s.topFile).toBe('/app/src/index.ts');
  });

  it('collects uniqueFiles without duplicates', () => {
    const frames = [
      makeFrame('/app/a.ts'),
      makeFrame('/app/a.ts'),
      makeFrame('/app/b.ts'),
    ];
    const s = summarizeFrames(frames);
    expect(s.uniqueFiles).toEqual(['/app/a.ts', '/app/b.ts']);
  });

  it('includes errorLine when provided', () => {
    const s = summarizeFrames([], 'TypeError: cannot read property');
    expect(s.errorLine).toBe('TypeError: cannot read property');
  });

  it('returns null topFile for empty frames', () => {
    const s = summarizeFrames([]);
    expect(s.topFile).toBeNull();
  });
});

describe('formatSummaryReport', () => {
  it('formats a full summary', () => {
    const s = summarizeFrames(
      [makeFrame('/app/src/index.ts'), makeFrame('/app/node_modules/x/y.js')],
      'Error: boom'
    );
    const out = formatSummaryReport(s);
    expect(out).toContain('Error: boom');
    expect(out).toContain('2 total');
    expect(out).toContain('/app/src/index.ts');
  });
});
