import { FrameGroup } from './group';
import { colorize, supportsColor } from './output';

const USE_COLOR = supportsColor();

function c(text: string, color: string): string {
  return USE_COLOR ? colorize(text, color) : text;
}

export function formatGroup(group: FrameGroup, verbose = false): string {
  const header = c(`▶ ${group.label}`, 'cyan') +
    c(` (${group.frames.length} frame${group.frames.length !== 1 ? 's' : ''})`, 'gray');

  if (!verbose) return header;

  const lines = group.frames.map(f => {
    const loc = f.line != null ? `:${f.line}` : '';
    const fn = f.fn ? c(f.fn, 'yellow') + ' ' : '';
    return `  ${fn}${c((f.file ?? '<unknown>') + loc, 'white')}`;
  });

  return [header, ...lines].join('\n');
}

export function formatGroupList(
  groups: FrameGroup[],
  verbose = false
): string {
  if (groups.length === 0) return c('No groups found.', 'gray');
  return groups.map(g => formatGroup(g, verbose)).join('\n');
}

export function formatGroupSummary(groups: FrameGroup[]): string {
  const total = groups.reduce((n, g) => n + g.frames.length, 0);
  return [
    c(`Groups: ${groups.length}`, 'green'),
    c(`Total frames: ${total}`, 'white'),
  ].join('  ');
}
