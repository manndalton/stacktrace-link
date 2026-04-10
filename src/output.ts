/**
 * Handles terminal output with optional color support.
 */

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";

function supportsColor(): boolean {
  return process.stdout.isTTY === true && process.env.NO_COLOR === undefined;
}

function colorize(text: string, ...codes: string[]): string {
  if (!supportsColor()) return text;
  return `${codes.join("")}${text}${RESET}`;
}

export function printError(message: string): void {
  console.error(colorize(`error: ${message}`, RED, BOLD));
}

export function printSuccess(message: string): void {
  console.log(colorize(message, GREEN));
}

export function printInfo(message: string): void {
  console.log(colorize(message, CYAN));
}

export function printDim(message: string): void {
  console.log(colorize(message, DIM));
}

export function printFrameList(frames: string[], highlightFirst: boolean = true): void {
  frames.forEach((frame, index) => {
    if (highlightFirst && index === 0) {
      console.log(colorize(`  → ${frame}`, YELLOW, BOLD));
    } else {
      console.log(colorize(`    ${frame}`, DIM));
    }
  });
}

export function printUsage(): void {
  const usage = [
    "",
    colorize("Usage:", BOLD),
    "  stacktrace-link [options]",
    "",
    colorize("Options:", BOLD),
    "  --all        Show all frames, not just user frames",
    "  --dry-run    Print the editor command without running it",
    "  --help       Show this help message",
    "",
  ];
  console.log(usage.join("\n"));
}
