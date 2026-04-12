import { groupFrames, sortGroups, FrameGroup } from './group';
import { StackFrame } from './parser';

function makeFrame(file: string, line = 1): StackFrame {
  return { file, line, column: 0, fn: 'fn', raw: '' };
}

describe('groupFrames', () => {
  it('groups by file', () => {
    const frames = [
      makeFrame('/app/src/a.ts'),
      makeFrame('/app/src/a.ts'),
      makeFrame('/app/src/b.ts'),
    ];
    const groups = groupFrames(frames, 'file');
    expect(groups).toHaveLength(2);
    const a = groups.find(g => g.key === '/app/src/a.ts')!;
    expect(a.frames).toHaveLength(2);
  });

  it('groups by directory', () => {
    const frames = [
      makeFrame('/app/src/a.ts'),
      makeFrame('/app/src/b.ts'),
      makeFrame('/app/lib/c.ts'),
    ];
    const groups = groupFrames(frames, 'directory');
    expect(groups).toHaveLength(2);
    expect(groups.find(g => g.key === '/app/src')).toBeDefined();
    expect(groups.find(g => g.key === '/app/lib')).toBeDefined();
  });

  it('groups by package', () => {
    const frames = [
      makeFrame('/app/node_modules/express/index.js'),
      makeFrame('/app/node_modules/express/router.js'),
      makeFrame('/app/src/index.ts'),
    ];
    const groups = groupFrames(frames, 'package');
    const express = groups.find(g => g.key === 'express')!;
    expect(express.frames).toHaveLength(2);
    const local = groups.find(g => g.key === '<local>')!;
    expect(local.frames).toHaveLength(1);
  });

  it('handles unknown file', () => {
    const frame: StackFrame = { file: undefined, line: 1, column: 0, fn: 'fn', raw: '' };
    const groups = groupFrames([frame], 'file');
    expect(groups[0].key).toBe('<unknown>');
  });
});

describe('sortGroups', () => {
  const groups: FrameGroup[] = [
    { key: 'a', label: 'a', frames: [makeFrame('a'), makeFrame('a')] },
    { key: 'b', label: 'b', frames: [makeFrame('b')] },
    { key: 'c', label: 'c', frames: [makeFrame('c'), makeFrame('c'), makeFrame('c')] },
  ];

  it('sorts descending by default', () => {
    const sorted = sortGroups(groups);
    expect(sorted[0].key).toBe('c');
    expect(sorted[2].key).toBe('b');
  });

  it('sorts ascending', () => {
    const sorted = sortGroups(groups, 'asc');
    expect(sorted[0].key).toBe('b');
    expect(sorted[2].key).toBe('c');
  });
});
