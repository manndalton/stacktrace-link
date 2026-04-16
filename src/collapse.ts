import { StackFrame } from './parser';

export interface CollapseOptions {
  minRepeat?: number;
  label?: string;
}

export interface CollapseResult {
  frames: StackFrame[];
  collapsedCount: number;
  ranges: Array<{ start: number; end: number; count: number }>;
}

export function collapseNodeModules(
  frames: StackFrame[],
  opts: CollapseOptions = {}
): CollapseResult {
  const { minRepeat = 1, label = '[node_modules]' } = opts;
  const result: StackFrame[] = [];
  const ranges: CollapseResult['ranges'] = [];
  let i = 0;
  let collapsedCount = 0;

  while (i < frames.length) {
    const frame = frames[i];
    if (frame.file && frame.file.includes('node_modules')) {
      const start = i;
      while (i < frames.length && frames[i].file && frames[i].file!.includes('node_modules')) {
        i++;
      }
      const count = i - start;
      if (count >= minRepeat) {
        collapsedCount += count;
        ranges.push({ start, end: i - 1, count });
        result.push({
          ...frames[start],
          file: label,
          line: 0,
          column: 0,
          fnName: `... ${count} frame${count !== 1 ? 's' : ''} collapsed`,
        });
      } else {
        for (let j = start; j < i; j++) result.push(frames[j]);
      }
    } else {
      result.push(frame);
      i++;
    }
  }

  return { frames: result, collapsedCount, ranges };
}

export function expandCollapsed(original: StackFrame[], collapsed: CollapseResult): StackFrame[] {
  return original.slice();
}
