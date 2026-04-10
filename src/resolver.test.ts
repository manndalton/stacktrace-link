import * as path from 'path';
import * as fs from 'fs';
import { resolveFrame, isUserFrame, resolveUserFrames, StackFrame } from './resolver';

jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('isUserFrame', () => {
  it('returns false for node: internal modules', () => {
    expect(isUserFrame({ file: 'node:internal/process', line: 1, column: 1 })).toBe(false);
  });

  it('returns false for node_modules paths', () => {
    expect(isUserFrame({ file: '/project/node_modules/express/index.js', line: 1, column: 1 })).toBe(false);
  });

  it('returns false for internal/ paths', () => {
    expect(isUserFrame({ file: 'internal/timers.js', line: 1, column: 1 })).toBe(false);
  });

  it('returns true for user source files', () => {
    expect(isUserFrame({ file: '/project/src/index.ts', line: 10, column: 5 })).toBe(true);
  });

  it('returns false for empty file string', () => {
    expect(isUserFrame({ file: '', line: 1, column: 1 })).toBe(false);
  });
});

describe('resolveFrame', () => {
  const projectRoot = '/project';

  beforeEach(() => {
    mockedFs.existsSync.mockReset();
  });

  it('resolves absolute paths as-is', () => {
    mockedFs.existsSync.mockReturnValue(true);
    const frame: StackFrame = { file: '/project/src/app.ts', line: 5, column: 3 };
    const resolved = resolveFrame(frame, projectRoot);
    expect(resolved.absolutePath).toBe('/project/src/app.ts');
    expect(resolved.exists).toBe(true);
  });

  it('resolves relative paths against projectRoot', () => {
    mockedFs.existsSync.mockReturnValue(true);
    const frame: StackFrame = { file: 'src/app.ts', line: 5, column: 3 };
    const resolved = resolveFrame(frame, projectRoot);
    expect(resolved.absolutePath).toBe(path.resolve(projectRoot, 'src/app.ts'));
  });

  it('marks non-existent files correctly', () => {
    mockedFs.existsSync.mockReturnValue(false);
    const frame: StackFrame = { file: '/missing/file.ts', line: 1, column: 1 };
    const resolved = resolveFrame(frame, projectRoot);
    expect(resolved.exists).toBe(false);
  });
});

describe('resolveUserFrames', () => {
  beforeEach(() => {
    mockedFs.existsSync.mockReturnValue(true);
  });

  it('filters out non-user frames and returns resolved ones', () => {
    const frames: StackFrame[] = [
      { file: '/project/src/index.ts', line: 10, column: 3 },
      { file: 'node:internal/process', line: 1, column: 1 },
      { file: '/project/node_modules/lib/index.js', line: 5, column: 2 },
    ];
    const resolved = resolveUserFrames(frames, '/project');
    expect(resolved).toHaveLength(1);
    expect(resolved[0].file).toBe('/project/src/index.ts');
  });
});
