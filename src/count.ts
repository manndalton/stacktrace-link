import { StackFrame } from './parser';

export interface CountResult {
  total: number;
  userFrames: number;
  nodeModules: number;
  internal: number;
  byFile: Record<string, number>;
  byFunction: Record<string, number>;
}

export function countFrames(frames: StackFrame[]): CountResult {
  const result: CountResult = {
    total: frames.length,
    userFrames: 0,
    nodeModules: 0,
    internal: 0,
    byFile: {},
    byFunction: {},
  };

  for (const frame of frames) {
    const file = frame.file ?? '(unknown)';
    const fn = frame.function ?? '(anonymous)';

    result.byFile[file] = (result.byFile[file] ?? 0) + 1;
    result.byFunction[fn] = (result.byFunction[fn] ?? 0) + 1;

    if (!frame.file) {
      result.internal++;
    } else if (frame.file.includes('node_modules')) {
      result.nodeModules++;
    } else if (frame.file.startsWith('node:') || frame.file.startsWith('internal/')) {
      result.internal++;
    } else {
      result.userFrames++;
    }
  }

  return result;
}

export function formatCountResult(result: CountResult): string {
  const lines: string[] = [
    `Total frames   : ${result.total}`,
    `User frames    : ${result.userFrames}`,
    `node_modules   : ${result.nodeModules}`,
    `Internal       : ${result.internal}`,
  ];

  const topFiles = Object.entries(result.byFile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topFiles.length > 0) {
    lines.push('', 'Top files:');
    for (const [file, count] of topFiles) {
      lines.push(`  ${count}x  ${file}`);
    }
  }

  return lines.join('\n');
}
