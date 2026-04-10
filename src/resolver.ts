import * as path from 'path';
import * as fs from 'fs';

export interface StackFrame {
  file: string;
  line: number;
  column: number;
  functionName?: string;
}

export interface ResolvedFrame extends StackFrame {
  absolutePath: string;
  exists: boolean;
}

/**
 * Resolves a stack frame's file path relative to a project root.
 * Handles both absolute paths and paths relative to node_modules.
 */
export function resolveFrame(
  frame: StackFrame,
  projectRoot: string = process.cwd()
): ResolvedFrame {
  let absolutePath: string;

  if (path.isAbsolute(frame.file)) {
    absolutePath = frame.file;
  } else {
    absolutePath = path.resolve(projectRoot, frame.file);
  }

  const exists = fs.existsSync(absolutePath);

  return {
    ...frame,
    absolutePath,
    exists,
  };
}

/**
 * Filters out frames from node_modules and Node.js internals.
 */
export function isUserFrame(frame: StackFrame): boolean {
  const file = frame.file;
  if (!file) return false;
  if (file.startsWith('node:')) return false;
  if (file.includes('node_modules')) return false;
  if (file.startsWith('internal/')) return false;
  return true;
}

/**
 * Resolves all user frames from a list of stack frames.
 */
export function resolveUserFrames(
  frames: StackFrame[],
  projectRoot?: string
): ResolvedFrame[] {
  return frames
    .filter(isUserFrame)
    .map((frame) => resolveFrame(frame, projectRoot))
    .filter((frame) => frame.exists);
}
