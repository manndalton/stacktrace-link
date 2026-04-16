import { collapseNodeModules, expandCollapsed } from './collapse';
import { StackFrame } from './parser';

function makeFrame(file: string, fn = 'fn'): StackFrame {
  return { file, line: 1, column: 1, fnName: fn, raw: '' };
}

const userFrame = makeFrame('/app/src/index.ts', 'main');
const nmFrame1 = makeFrame('/app/node_modules/express/index.js', 'handle');
const nmFrame2 = makeFrame('/app/node_modules/express/router.js', 'dispatch');
const nmFrame3 = makeFrame('/app/node_modules/body-parser/index.js', 'parse');

describe('collapseNodeModules', () => {
  it('collapses consecutive node_modules frames', () => {
    const frames = [userFrame, nmFrame1, nmFrame2, nmFrame3, userFrame];
    const result = collapseNodeModules(frames);
    expect(result.frames).toHaveLength(3);
    expect(result.collapsedCount).toBe(3);
    expect(result.frames[1].fnName).toMatch(/3 frames collapsed/);
  });

  it('preserves user frames', () => {
    const frames = [userFrame, nmFrame1, userFrame];
    const result = collapseNodeModules(frames);
    expect(result.frames[0]).toBe(userFrame);
    expect(result.frames[2]).toBe(userFrame);
  });

  it('returns empty ranges when no node_modules', () => {
    const result = collapseNodeModules([userFrame]);
    expect(result.collapsedCount).toBe(0);
    expect(result.ranges).toHaveLength(0);
  });

  it('respects minRepeat option', () => {
    const frames = [nmFrame1, userFrame];
    const result = collapseNodeModules(frames, { minRepeat: 2 });
    expect(result.frames[0]).toBe(nmFrame1);
    expect(result.collapsedCount).toBe(0);
  });

  it('uses custom label', () => {
    const frames = [nmFrame1, nmFrame2];
    const result = collapseNodeModules(frames, { label: '[vendor]' });
    expect(result.frames[0].file).toBe('[vendor]');
  });

  it('handles all node_modules', () => {
    const frames = [nmFrame1, nmFrame2, nmFrame3];
    const result = collapseNodeModules(frames);
    expect(result.frames).toHaveLength(1);
    expect(result.collapsedCount).toBe(3);
  });

  it('expandCollapsed returns original frames', () => {
    const frames = [userFrame, nmFrame1, nmFrame2];
    const collapsed = collapseNodeModules(frames);
    const expanded = expandCollapsed(frames, collapsed);
    expect(expanded).toHaveLength(3);
  });
});
