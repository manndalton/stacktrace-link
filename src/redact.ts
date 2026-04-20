import * as path from 'path';

export interface RedactConfig {
  homedir?: string;
  patterns?: RegExp[];
  replaceWith?: string;
}

const DEFAULT_REPLACE = '<redacted>';

const BUILTIN_PATTERNS: RegExp[] = [
  // Absolute Windows paths with drive letters
  /[A-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*/gi,
  // Unix home directories like /home/username or /Users/username
  /\/(?:home|Users)\/[^\/\s:)]+/g,
  // Common secret-like tokens (hex 32+ chars)
  /\b[0-9a-f]{32,}\b/gi,
];

export function redactHomedir(text: string, homedir?: string): string {
  const home = homedir ?? (process.env.HOME || process.env.USERPROFILE || '');
  if (!home) return text;
  const escaped = home.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(escaped, 'g'), '~');
}

export function redactPatterns(
  text: string,
  patterns: RegExp[],
  replaceWith: string = DEFAULT_REPLACE
): string {
  let result = text;
  for (const pattern of patterns) {
    const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
    const global = new RegExp(pattern.source, flags);
    result = result.replace(global, replaceWith);
  }
  return result;
}

export function redactFrame(frameLine: string, config: RedactConfig = {}): string {
  const { homedir, patterns = [], replaceWith = DEFAULT_REPLACE } = config;
  let result = redactHomedir(frameLine, homedir);
  result = redactPatterns(result, [...BUILTIN_PATTERNS, ...patterns], replaceWith);
  return result;
}

export function redactStackTrace(trace: string, config: RedactConfig = {}): string {
  return trace
    .split('\n')
    .map(line => redactFrame(line, config))
    .join('\n');
}
