import { formatGroup, formatGroupList, formatGroupSummary } from './group-formatter';
import { FrameGroup } from './group';
import { StackFrame } from './parser';

function makeFrame(file: string, fn = 'myFn'): StackFrame {
  return { file, line: 10, column: 0, fn, raw: '' };
}

function makeGroup(key: string, count: number): FrameGroup {
  return {
    key,
    label: key,
    frames: Array.from({ length: count }, () => makeFrame(key)),
  };
}

describe('formatGroup', () => {
  it('includes label and frame count', () => {
    const group = makeGroup('/app/src/a.ts', 3);
    const out = formatGroup(group);
    expect(out).toContain('/app/src/a.ts');
    expect(out).toContain('3 frames');
  });

  it('uses singular for 1 frame', () => {
    const group = makeGroup('/app/src/a.ts', 1);
    const out = formatGroup(group);
    expect(out).toContain('1 frame');
    expect(out).not.toContain('frames');
  });

  it('verbose mode includes frame details', () => {
    const group = makeGroup('/app/src/a.ts', 2);
    const out = formatGroup(group, true);
    expect(out).toContain('myFn');
    expect(out).toContain(':10');
  });
});

describe('formatGroupList', () => {
  it('returns no-groups message for empty list', () => {
    expect(formatGroupList([])).toContain('No groups found');
  });

  it('formats multiple groups', () => {
    const groups = [makeGroup('a.ts', 2), makeGroup('b.ts', 1)];
    const out = formatGroupList(groups);
    expect(out).toContain('a.ts');
    expect(out).toContain('b.ts');
  });
});

describe('formatGroupSummary', () => {
  it('shows group count and total frames', () => {
    const groups = [makeGroup('a.ts', 3), makeGroup('b.ts', 2)];
    const out = formatGroupSummary(groups);
    expect(out).toContain('Groups: 2');
    expect(out).toContain('Total frames: 5');
  });
});
