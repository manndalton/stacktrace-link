/**
 * Formats stack frames for display in the terminal.
 */

import * as path from "path";

export interface FrameDisplay {
  file: string;
  line: number;
  column: number;
  functionName?: string;
  isUser: boolean;
}

export function formatFrame(frame: FrameDisplay, cwd: string = process.cwd()): string {
  const relativePath = path.isAbsolute(frame.file)
    ? path.relative(cwd, frame.file)
    : frame.file;

  const location = `${relativePath}:${frame.line}:${frame.column}`;
  const fn = frame.functionName ? `${frame.functionName} ` : "";

  return `${fn}(${location})`;
}

export function formatFrameList(
  frames: FrameDisplay[],
  options: { showAll?: boolean; cwd?: string } = {}
): string[] {
  const { showAll = false, cwd = process.cwd() } = options;
  const visible = showAll ? frames : frames.filter((f) => f.isUser);
  return visible.map((f) => formatFrame(f, cwd));
}

export function formatSummary(frames: FrameDisplay[], cwd: string = process.cwd()): string {
  const userFrames = frames.filter((f) => f.isUser);
  if (userFrames.length === 0) {
    return "No user frames found in stack trace.";
  }
  const first = userFrames[0];
  return `Opening ${formatFrame(first, cwd)}`;
}
