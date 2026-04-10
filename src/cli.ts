#!/usr/bin/env node
import * as fs from 'fs';
import * as readline from 'readline';
import { parseStackTrace, firstUserFrame } from './parser';
import { openInEditor, detectEditor } from './editor';

export interface CliOptions {
  editor?: string;
  all?: boolean;
  file?: string;
}

export async function readStdin(): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin });
  const lines: string[] = [];
  for await (const line of rl) {
    lines.push(line);
  }
  return lines.join('\n');
}

export async function run(options: CliOptions = {}): Promise<void> {
  let input: string;

  if (options.file) {
    if (!fs.existsSync(options.file)) {
      console.error(`Error: file not found: ${options.file}`);
      process.exit(1);
    }
    input = fs.readFileSync(options.file, 'utf-8');
  } else if (!process.stdin.isTTY) {
    input = await readStdin();
  } else {
    console.error('Usage: stacktrace-link [--editor <editor>] [--all] [file]');
    console.error('       cat error.log | stacktrace-link');
    process.exit(1);
  }

  const frames = parseStackTrace(input);

  if (frames.length === 0) {
    console.error('No stack frames found in input.');
    process.exit(1);
  }

  const editor = options.editor ?? detectEditor();

  if (options.all) {
    for (const frame of frames) {
      await openInEditor(frame, editor);
    }
  } else {
    const frame = firstUserFrame(frames);
    if (!frame) {
      console.error('No user-land stack frame found.');
      process.exit(1);
    }
    await openInEditor(frame, editor);
  }
}

run({
  editor: process.env.STACKTRACE_EDITOR,
  all: process.argv.includes('--all'),
  file: process.argv.find((a, i) => i > 1 && !a.startsWith('-')),
});
