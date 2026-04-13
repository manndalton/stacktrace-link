import { foldFrames, unfoldAll, isNodeModulesFrame, isInternalFrame } from './fold';
import { StackFrame } from './parser';

function makeFrame(file: string, line = 1): StackFrame {
  return { file, line, column: 0, name: 'fn', raw: `at fn (${file}:${line}:0)` };
}

describe('isNodeModulesFrame', () => {
  it('returns true for node_modules path', () => {
    expect(isNodeModulesFrame(makeFrame('/project/node_modules/express/index.js'))).toBe(true);
  });

  it('returns false for user path', () => {
    expect(isNodeModulesFrame(makeFrame('/project/src/app.ts'))).toBe(false);
  });
});

describe('isInternalFrame', () => {
  it('returns true for node: protocol', () => {
    expect(isInternalFrame(makeFrame('node:fs'))).toBe(true);
  });

  it('returns true for internal/ path', () => {
    expect(isInternalFrame(makeFrame('internal/modules/cjs/loader.js'))).toBe(true);
  });

  it('returns false for user path', () => {
    expect(isInternalFrame(makeFrame('/project/src/app.ts'))).toBe(false);
  });
});

describe('foldFrames', () => {
  it('collapses node_modules frames into a single group', () => {
    const frames = [
      makeFrame('/project/src/app.ts'),
      makeFrame('/project/node_modules/express/index.js'),
      makeFrame('/project/node_modules/express/router.js'),
      makeFrame('/project/src/handler.ts'),
    ];
    const groups = foldFrames(frames);
    expect(groups).toHaveLength(3);
    expect(groups[1].collapsed).toBe(true);
    expect(groups[1].reason).toBe('node_modules');
    expect(groups[1].count).toBe(2);
  });

  it('collapses internal frames', () => {
    const frames = [
      makeFrame('/project/src/app.ts'),
      makeFrame('node:events'),
      makeFrame('node:fs'),
    ];
    const groups = foldFrames(frames);
    expect(groups[1].collapsed).toBe(true);
    expect(groups[1].reason).toBe('internal');
  });

  it('collapses repeating frame sequences', () => {
    const pattern = [makeFrame('/project/src/recurse.ts', 10), makeFrame('/project/src/recurse.ts', 20)];
    const frames = [...pattern, ...pattern, ...pattern];
    const groups = foldFrames(frames, { collapseNodeModules: false, collapseInternal: false });
    expect(groups).toHaveLength(1);
    expect(groups[0].collapsed).toBe(true);
    expect(groups[0].reason).toBe('repeat');
  });

  it('does not collapse when collapseNodeModules is false', () => {
    const frames = [
      makeFrame('/project/node_modules/lib/index.js'),
      makeFrame('/project/node_modules/lib/util.js'),
    ];
    const groups = foldFrames(frames, { collapseNodeModules: false });
    expect(groups.every(g => !g.collapsed)).toBe(true);
  });
});

describe('unfoldAll', () => {
  it('flattens all groups back to frames', () => {
    const frames = [
      makeFrame('/project/src/app.ts'),
      makeFrame('/project/node_modules/express/index.js'),
    ];
    const groups = foldFrames(frames);
    expect(unfoldAll(groups)).toEqual(frames);
  });
});
