export interface StackFrame {
  functionName: string | null;
  filePath: string;
  line: number;
  column: number;
}

const STACK_FRAME_REGEX =
  /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?\s*$/;

export function parseStackTrace(input: string): StackFrame[] {
  const lines = input.split('\n');
  const frames: StackFrame[] = [];

  for (const line of lines) {
    const match = STACK_FRAME_REGEX.exec(line);
    if (!match) continue;

    const [, functionName, filePath, lineStr, columnStr] = match;

    // Skip internal Node.js frames
    if (
      filePath.startsWith('node:') ||
      filePath.startsWith('internal/')
    ) {
      continue;
    }

    frames.push({
      functionName: functionName ?? null,
      filePath,
      line: parseInt(lineStr, 10),
      column: parseInt(columnStr, 10),
    });
  }

  return frames;
}

export function firstUserFrame(frames: StackFrame[]): StackFrame | null {
  return frames.find((f) => !f.filePath.includes('node_modules')) ?? null;
}
