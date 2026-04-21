import { shouldStripFrame, stripFrames, buildStripOptions, countStripped } from './strip';
import { StackFrame } from './parser';

function makeFrame(file: string, fn?: string): StackFrame {
  return { file, line: 1, column: 1, fn: fn ?? 'anonymous' };
}

describe('shouldStripFrame', () => {
  it('strips node_modules frames when option is set', () => {
    const frame = makeFrame('/project/node_modules/express/index.js');
    expect(shouldStripFrame(frame, { nodeModules: true })).toBe(true);
  });

  it('keeps node_modules frames when option is not set', () => {
    const frame = makeFrame('/project/node_modules/express/index.js');
    expect(shouldStripFrame(frame, {})).toBe(false);
  });

  it('strips internal node: frames', () => {
    const frame = makeFrame('node:internal/modules/cjs/loader');
    expect(shouldStripFrame(frame, { internals: true })).toBe(true);
  });

  it('strips internal/ frames', () => {
    const frame = makeFrame('internal/bootstrap/node.js');
    expect(shouldStripFrame(frame, { internals: true })).toBe(true);
  });

  it('strips anonymous frames when option is set', () => {
    const frame = makeFrame('<anonymous>');
    expect(shouldStripFrame(frame, { anonymousFrames: true })).toBe(true);
  });

  it('strips frames matching custom pattern', () => {
    const frame = makeFrame('/project/src/generated/schema.js');
    expect(shouldStripFrame(frame, { customPatterns: [/generated/] })).toBe(true);
  });

  it('does not strip user frames with no options', () => {
    const frame = makeFrame('/project/src/app.ts');
    expect(shouldStripFrame(frame, {})).toBe(false);
  });
});

describe('stripFrames', () => {
  it('removes node_modules and keeps user frames', () => {
    const frames = [
      makeFrame('/project/src/index.ts'),
      makeFrame('/project/node_modules/lodash/chunk.js'),
      makeFrame('/project/src/utils.ts'),
    ];
    const result = stripFrames(frames, { nodeModules: true });
    expect(result).toHaveLength(2);
    expect(result[0].file).toBe('/project/src/index.ts');
    expect(result[1].file).toBe('/project/src/utils.ts');
  });

  it('returns all frames when no options are set', () => {
    const frames = [makeFrame('/a.ts'), makeFrame('/b.ts')];
    expect(stripFrames(frames, {})).toHaveLength(2);
  });
});

describe('buildStripOptions', () => {
  it('maps nodeModules arg', () => {
    const opts = buildStripOptions({ nodeModules: true });
    expect(opts.nodeModules).toBe(true);
  });

  it('maps single pattern string', () => {
    const opts = buildStripOptions({ pattern: 'generated' });
    expect(opts.customPatterns).toHaveLength(1);
    expect(opts.customPatterns![0].test('generated/schema.js')).toBe(true);
  });

  it('maps multiple pattern strings', () => {
    const opts = buildStripOptions({ pattern: ['generated', 'vendor'] });
    expect(opts.customPatterns).toHaveLength(2);
  });
});

describe('countStripped', () => {
  it('returns the difference in frame counts', () => {
    const original = [makeFrame('a'), makeFrame('b'), makeFrame('c')];
    const stripped = [makeFrame('a')];
    expect(countStripped(original, stripped)).toBe(2);
  });
});
