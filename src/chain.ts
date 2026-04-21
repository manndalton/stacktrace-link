import { StackFrame } from './parser';

export interface FrameChain {
  root: StackFrame;
  children: FrameChain[];
  depth: number;
}

export function buildChain(frames: StackFrame[]): FrameChain | null {
  if (frames.length === 0) return null;

  const root: FrameChain = {
    root: frames[0],
    children: [],
    depth: 0,
  };

  let current = root;
  for (let i = 1; i < frames.length; i++) {
    const node: FrameChain = {
      root: frames[i],
      children: [],
      depth: i,
    };
    current.children.push(node);
    current = node;
  }

  return root;
}

export function flattenChain(chain: FrameChain): StackFrame[] {
  const result: StackFrame[] = [];
  function walk(node: FrameChain) {
    result.push(node.root);
    for (const child of node.children) {
      walk(child);
    }
  }
  walk(chain);
  return result;
}

export function chainDepth(chain: FrameChain): number {
  let max = chain.depth;
  for (const child of chain.children) {
    const d = chainDepth(child);
    if (d > max) max = d;
  }
  return max;
}

export function formatChain(chain: FrameChain, indent = 0): string {
  const pad = '  '.repeat(indent);
  const { file, line, column, fn } = chain.root;
  const loc = `${file}:${line}${column !== undefined ? ':' + column : ''}`;
  const label = fn ? `${fn} (${loc})` : loc;
  const lines = [`${pad}${label}`];
  for (const child of chain.children) {
    lines.push(formatChain(child, indent + 1));
  }
  return lines.join('\n');
}
