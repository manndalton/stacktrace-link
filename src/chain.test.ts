import { buildChain, flattenChain, chainDepth, formatChain } from './chain';
import { StackFrame } from './parser';

function makeFrame(file: string, line: number, fn?: string): StackFrame {
  return { file, line, column: 1, fn };
}

const frames: StackFrame[] = [
  makeFrame('/app/index.ts', 10, 'main'),
  makeFrame('/app/router.ts', 42, 'handle'),
  makeFrame('/app/db.ts', 7, 'query'),
];

describe('buildChain', () => {
  it('returns null for empty frames', () => {
    expect(buildChain([])).toBeNull();
  });

  it('builds a linear chain from frames', () => {
    const chain = buildChain(frames);
    expect(chain).not.toBeNull();
    expect(chain!.root.file).toBe('/app/index.ts');
    expect(chain!.children).toHaveLength(1);
    expect(chain!.children[0].root.file).toBe('/app/router.ts');
  });

  it('assigns correct depth values', () => {
    const chain = buildChain(frames);
    expect(chain!.depth).toBe(0);
    expect(chain!.children[0].depth).toBe(1);
    expect(chain!.children[0].children[0].depth).toBe(2);
  });
});

describe('flattenChain', () => {
  it('returns frames in original order', () => {
    const chain = buildChain(frames)!;
    const flat = flattenChain(chain);
    expect(flat).toHaveLength(3);
    expect(flat[0].file).toBe('/app/index.ts');
    expect(flat[2].file).toBe('/app/db.ts');
  });
});

describe('chainDepth', () => {
  it('returns max depth of chain', () => {
    const chain = buildChain(frames)!;
    expect(chainDepth(chain)).toBe(2);
  });

  it('returns 0 for single frame', () => {
    const chain = buildChain([frames[0]])!;
    expect(chainDepth(chain)).toBe(0);
  });
});

describe('formatChain', () => {
  it('formats chain with indentation', () => {
    const chain = buildChain(frames)!;
    const output = formatChain(chain);
    expect(output).toContain('main (/app/index.ts:10:1)');
    expect(output).toContain('  handle (/app/router.ts:42:1)');
    expect(output).toContain('    query (/app/db.ts:7:1)');
  });

  it('handles frames without function names', () => {
    const chain = buildChain([makeFrame('/app/anon.ts', 5)])!;
    const output = formatChain(chain);
    expect(output).toContain('/app/anon.ts:5:1');
    expect(output).not.toContain('undefined');
  });
});
