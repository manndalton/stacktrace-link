import { computeTopFiles, computeTopErrors, generateReport } from './report';
import * as historyModule from './history';
import * as snapshotModule from './snapshot';
import { StackFrame } from './parser';

describe('computeTopFiles', () => {
  it('returns empty array for no frames', () => {
    expect(computeTopFiles([])).toEqual([]);
  });

  it('counts and sorts files by frequency', () => {
    const frames: StackFrame[] = [
      { file: 'a.ts', line: 1, column: 1, raw: '' },
      { file: 'b.ts', line: 2, column: 1, raw: '' },
      { file: 'a.ts', line: 3, column: 1, raw: '' },
      { file: 'a.ts', line: 4, column: 1, raw: '' },
    ];
    const result = computeTopFiles(frames);
    expect(result[0]).toEqual({ file: 'a.ts', count: 3 });
    expect(result[1]).toEqual({ file: 'b.ts', count: 1 });
  });

  it('returns at most 5 entries', () => {
    const frames: StackFrame[] = Array.from({ length: 20 }, (_, i) => ({
      file: `file${i}.ts`,
      line: 1,
      column: 1,
      raw: '',
    }));
    expect(computeTopFiles(frames).length).toBeLessThanOrEqual(5);
  });
});

describe('computeTopErrors', () => {
  it('returns empty array for no messages', () => {
    expect(computeTopErrors([])).toEqual([]);
  });

  it('counts and sorts error messages', () => {
    const messages = ['TypeError: x', 'RangeError: y', 'TypeError: x'];
    const result = computeTopErrors(messages);
    expect(result[0]).toEqual({ message: 'TypeError: x', count: 2 });
    expect(result[1]).toEqual({ message: 'RangeError: y', count: 1 });
  });
});

describe('generateReport', () => {
  it('aggregates history and snapshot data', async () => {
    jest.spyOn(historyModule, 'loadHistory').mockResolvedValue([
      { id: '1', timestamp: '', raw: '', frames: [{ file: 'app.ts', line: 1, column: 1, raw: '' }], errorMessage: 'Error: boom' },
      { id: '2', timestamp: '', raw: '', frames: [{ file: 'app.ts', line: 5, column: 1, raw: '' }], errorMessage: 'Error: boom' },
    ] as any);
    jest.spyOn(snapshotModule, 'listSnapshots').mockResolvedValue([{} as any, {} as any]);

    const report = await generateReport();
    expect(report.totalTraces).toBe(2);
    expect(report.snapshotCount).toBe(2);
    expect(report.topFiles[0].file).toBe('app.ts');
    expect(report.topErrors[0].message).toBe('Error: boom');
    expect(report.generatedAt).toBeTruthy();

    jest.restoreAllMocks();
  });
});
