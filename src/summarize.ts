import { StackFrame } from './parser';

export interface StackSummary {
  totalFrames: number;
  userFrames: number;
  nodeModulesFrames: number;
  internalFrames: number;
  topFile: string | null;
  errorLine: string | null;
  uniqueFiles: string[];
}

export function summarizeFrames(frames: StackFrame[], errorLine?: string): StackSummary {
  const userFrames = frames.filter(f => !isNodeModules(f) && !isInternal(f));
  const nodeModulesFrames = frames.filter(f => isNodeModules(f));
  const internalFrames = frames.filter(f => isInternal(f));

  const fileCounts: Record<string, number> = {};
  for (const f of userFrames) {
    if (f.file) fileCounts[f.file] = (fileCounts[f.file] ?? 0) + 1;
  }

  const topFile = Object.entries(fileCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const uniqueFiles = [...new Set(userFrames.map(f => f.file).filter(Boolean) as string[])];

  return {
    totalFrames: frames.length,
    userFrames: userFrames.length,
    nodeModulesFrames: nodeModulesFrames.length,
    internalFrames: internalFrames.length,
    topFile,
    errorLine: errorLine ?? null,
    uniqueFiles,
  };
}

function isNodeModules(f: StackFrame): boolean {
  return !!f.file && f.file.includes('node_modules');
}

function isInternal(f: StackFrame): boolean {
  return !!f.file && (f.file.startsWith('node:') || f.file.startsWith('internal/'));
}

export function formatSummaryReport(summary: StackSummary): string {
  const lines: string[] = [];
  if (summary.errorLine) lines.push(`Error: ${summary.errorLine}`);
  lines.push(`Frames: ${summary.totalFrames} total, ${summary.userFrames} user, ${summary.nodeModulesFrames} node_modules, ${summary.internalFrames} internal`);
  if (summary.topFile) lines.push(`Top file: ${summary.topFile}`);
  if (summary.uniqueFiles.length > 0) lines.push(`Files involved: ${summary.uniqueFiles.join(', ')}`);
  return lines.join('\n');
}
