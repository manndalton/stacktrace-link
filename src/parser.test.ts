import { describe, it, expect } from 'vitest';
import { parseStackTrace, firstUserFrame } from './parser';

const SAMPLE_TRACE = `Error: something went wrong
    at doWork (/home/user/project/src/worker.ts:42:13)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async main (/home/user/project/src/index.ts:10:3)`;

describe('parseStackTrace', () => {
  it('parses named frames', () => {
    const frames = parseStackTrace(SAMPLE_TRACE);
    expect(frames).toHaveLength(2);
    expect(frames[0]).toMatchObject({
      functionName: 'doWork',
      filePath: '/home/user/project/src/worker.ts',
      line: 42,
      column: 13,
    });
  });

  it('skips node: internal frames', () => {
    const frames = parseStackTrace(SAMPLE_TRACE);
    const internal = frames.find((f) => f.filePath.includes('node:'));
    expect(internal).toBeUndefined();
  });

  it('handles anonymous frames without a function name', () => {
    const trace = `Error: oops\n    at /home/user/project/src/anon.ts:5:1`;
    const frames = parseStackTrace(trace);
    expect(frames[0].functionName).toBeNull();
  });

  it('returns empty array for non-stack input', () => {
    expect(parseStackTrace('just some text')).toEqual([]);
  });
});

describe('firstUserFrame', () => {
  it('skips node_modules frames', () => {
    const frames = parseStackTrace(
      `Error: x\n    at fn (/project/node_modules/lib/index.js:1:1)\n    at myFn (/project/src/app.ts:3:5)`
    );
    const frame = firstUserFrame(frames);
    expect(frame?.filePath).toBe('/project/src/app.ts');
  });

  it('returns null when all frames are from node_modules', () => {
    const frames = parseStackTrace(
      `Error: x\n    at fn (/project/node_modules/a/index.js:1:1)`
    );
    expect(firstUserFrame(frames)).toBeNull();
  });
});
