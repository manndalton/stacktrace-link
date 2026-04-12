import { StackFrame } from './parser';

export interface FrameExplanation {
  frame: StackFrame;
  summary: string;
  suggestions: string[];
}

export interface ExplainResult {
  errorType: string;
  errorMessage: string;
  explanations: FrameExplanation[];
  tip: string;
}

const ERROR_TIPS: Record<string, string> = {
  TypeError: 'Check for null/undefined values or incorrect argument types.',
  ReferenceError: 'Ensure the variable is declared before use.',
  SyntaxError: 'Review the syntax near the reported line.',
  RangeError: 'Check array indices and numeric bounds.',
  Error: 'Inspect the call stack for the root cause.',
};

export function explainFrame(frame: StackFrame): FrameExplanation {
  const suggestions: string[] = [];

  if (frame.file.includes('node_modules')) {
    suggestions.push('This frame is inside a dependency — likely not your code.');
  } else {
    suggestions.push(`Open ${frame.file}:${frame.line} in your editor to inspect.`);
  }

  if (frame.column === 1) {
    suggestions.push('Column 1 may indicate a transpilation source-map issue.');
  }

  const summary = frame.fn
    ? `In function "${frame.fn}" at ${frame.file}:${frame.line}:${frame.column}`
    : `At ${frame.file}:${frame.line}:${frame.column}`;

  return { frame, summary, suggestions };
}

export function explainStackTrace(
  errorType: string,
  errorMessage: string,
  frames: StackFrame[]
): ExplainResult {
  const explanations = frames.map(explainFrame);
  const tip = ERROR_TIPS[errorType] ?? ERROR_TIPS['Error'];
  return { errorType, errorMessage, explanations, tip };
}
