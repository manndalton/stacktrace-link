import { addReplay, loadReplays, findReplay, removeReplay, clearReplays, ReplayEntry } from './replay';
import { parseStackTrace } from './parser';
import { openInEditor, detectEditor } from './editor';
import { resolveUserFrames } from './resolver';

export function printUsage(): void {
  console.log(`Usage: stacktrace-link replay <command> [options]

Commands:
  save [--label <name>]   Save stdin as a replay
  list                    List saved replays
  run <id>                Re-open the first frame of a saved replay
  remove <id>             Delete a replay entry
  clear                   Remove all replays
  help                    Show this help
`);
}

export function formatEntry(entry: ReplayEntry): string {
  const date = new Date(entry.timestamp).toLocaleString();
  const label = entry.label ? ` [${entry.label}]` : '';
  const preview = entry.input.split('\n')[0].slice(0, 60);
  return `${entry.id}${label}  ${date}\n  ${preview}`;
}

export function runSave(input: string, label?: string): void {
  const entry = addReplay(input, label);
  console.log(`Saved replay: ${entry.id}${label ? ' (' + label + ')' : ''}`);
}

export function runList(): void {
  const entries = loadReplays();
  if (entries.length === 0) {
    console.log('No replays saved.');
    return;
  }
  entries.forEach(e => console.log(formatEntry(e) + '\n'));
}

export async function runRun(id: string): Promise<void> {
  const entry = findReplay(id);
  if (!entry) {
    console.error(`Replay not found: ${id}`);
    process.exit(1);
  }
  const frames = parseStackTrace(entry.input);
  const userFrames = resolveUserFrames(frames);
  const frame = userFrames[0] ?? frames[0];
  if (!frame) {
    console.error('No frames found in replay.');
    process.exit(1);
  }
  const editor = detectEditor();
  const cmd = await openInEditor(editor, frame.file, frame.line);
  console.log(`Opened: ${frame.file}:${frame.line}`);
}

export function runRemove(id: string): void {
  const ok = removeReplay(id);
  if (!ok) {
    console.error(`Replay not found: ${id}`);
    process.exit(1);
  }
  console.log(`Removed replay: ${id}`);
}

export function runClear(): void {
  clearReplays();
  console.log('All replays cleared.');
}

export async function runReplayCli(argv: string[]): Promise<void> {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'save': {
      const labelIdx = rest.indexOf('--label');
      const label = labelIdx !== -1 ? rest[labelIdx + 1] : undefined;
      const input = fs.existsSync('/dev/stdin') ? require('fs').readFileSync('/dev/stdin', 'utf8') : '';
      runSave(input, label);
      break;
    }
    case 'list': runList(); break;
    case 'run': await runRun(rest[0]); break;
    case 'remove': runRemove(rest[0]); break;
    case 'clear': runClear(); break;
    default: printUsage();
  }
}

import * as fs from 'fs';
