import { StackFrame } from './parser';

export type ReorderStrategy = 'reverse' | 'innermost' | 'outermost' | 'alphabetical' | 'none';

export interface ReorderConfig {
  strategy: ReorderStrategy;
  limit?: number;
}

export function reverseFrames(frames: StackFrame[]): StackFrame[] {
  return [...frames].reverse();
}

export function innermostFirst(frames: StackFrame[]): StackFrame[] {
  // Node.js stacks are already innermost-first; return as-is
  return [...frames];
}

export function outermostFirst(frames: StackFrame[]): StackFrame[] {
  return [...frames].reverse();
}

export function alphabeticalByFile(frames: StackFrame[]): StackFrame[] {
  return [...frames].sort((a, b) => {
    const fa = a.file ?? '';
    const fb = b.file ?? '';
    if (fa !== fb) return fa.localeCompare(fb);
    return (a.line ?? 0) - (b.line ?? 0);
  });
}

export function applyReorder(frames: StackFrame[], config: ReorderConfig): StackFrame[] {
  let result: StackFrame[];

  switch (config.strategy) {
    case 'reverse':
      result = reverseFrames(frames);
      break;
    case 'innermost':
      result = innermostFirst(frames);
      break;
    case 'outermost':
      result = outermostFirst(frames);
      break;
    case 'alphabetical':
      result = alphabeticalByFile(frames);
      break;
    case 'none':
    default:
      result = [...frames];
      break;
  }

  if (config.limit !== undefined && config.limit > 0) {
    result = result.slice(0, config.limit);
  }

  return result;
}

export function parseReorderStrategy(value: string): ReorderStrategy {
  const valid: ReorderStrategy[] = ['reverse', 'innermost', 'outermost', 'alphabetical', 'none'];
  if (valid.includes(value as ReorderStrategy)) {
    return value as ReorderStrategy;
  }
  throw new Error(`Unknown reorder strategy: "${value}". Valid: ${valid.join(', ')}`);
}
