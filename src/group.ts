import { StackFrame } from './parser';

export interface FrameGroup {
  key: string;
  label: string;
  frames: StackFrame[];
}

export type GroupBy = 'file' | 'directory' | 'package';

function getGroupKey(frame: StackFrame, by: GroupBy): string {
  const file = frame.file ?? '<unknown>';
  if (by === 'file') return file;
  if (by === 'directory') {
    const parts = file.split('/');
    return parts.slice(0, -1).join('/') || '.';
  }
  if (by === 'package') {
    const match = file.match(/node_modules\/([^/]+)/);
    return match ? match[1] : '<local>';
  }
  return file;
}

export function groupFrames(
  frames: StackFrame[],
  by: GroupBy = 'file'
): FrameGroup[] {
  const map = new Map<string, StackFrame[]>();

  for (const frame of frames) {
    const key = getGroupKey(frame, by);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(frame);
  }

  return Array.from(map.entries()).map(([key, groupFrames]) => ({
    key,
    label: key,
    frames: groupFrames,
  }));
}

export function sortGroups(
  groups: FrameGroup[],
  order: 'asc' | 'desc' = 'desc'
): FrameGroup[] {
  return [...groups].sort((a, b) =>
    order === 'desc'
      ? b.frames.length - a.frames.length
      : a.frames.length - b.frames.length
  );
}

/**
 * Filters groups to only those containing at least `minFrames` frames.
 * Useful for hiding noise when displaying grouped stack traces.
 */
export function filterGroups(
  groups: FrameGroup[],
  minFrames: number = 1
): FrameGroup[] {
  return groups.filter((group) => group.frames.length >= minFrames);
}
