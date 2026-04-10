import * as fs from 'fs';
import * as readline from 'readline';
import { parseStackTrace, firstUserFrame } from './parser';
import { resolveFrame } from './resolver';
import { loadConfig } from './config';
import { buildEditorCommand, openInEditor } from './editor';
import { printError, printSuccess, printInfo } from './output';

export interface WatchOptions {
  configPath?: string;
  autoOpen?: boolean;
}

export function watchStdin(options: WatchOptions = {}): void {
  const config = loadConfig(options.configPath);
  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
  });

  const buffer: string[] = [];

  printInfo('Watching stdin for stack traces... (Ctrl+C to exit)');

  rl.on('line', (line: string) => {
    buffer.push(line);
    tryProcessBuffer(buffer, config, options);
  });

  rl.on('close', () => {
    if (buffer.length > 0) {
      tryProcessBuffer(buffer, config, options, true);
    }
  });
}

function tryProcessBuffer(
  buffer: string[],
  config: ReturnType<typeof loadConfig>,
  options: WatchOptions,
  flush = false
): void {
  const text = buffer.join('\n');
  const frames = parseStackTrace(text);

  if (frames.length === 0 && !flush) return;

  const frame = firstUserFrame(frames);
  if (!frame) return;

  const resolved = resolveFrame(frame, config);
  if (!resolved) {
    printError(`Could not resolve frame: ${frame.file}`);
    return;
  }

  printSuccess(`Found: ${resolved.absolutePath}:${resolved.line}:${resolved.column}`);

  if (options.autoOpen !== false) {
    const editor = config?.editor ?? process.env.EDITOR ?? 'code';
    const cmd = buildEditorCommand(editor, resolved.absolutePath, resolved.line, resolved.column);
    openInEditor(cmd);
  }

  buffer.length = 0;
}

export function watchFile(filePath: string, options: WatchOptions = {}): fs.FSWatcher {
  const config = loadConfig(options.configPath);
  printInfo(`Watching file: ${filePath}`);

  const watcher = fs.watch(filePath, () => {
    const content = fs.readFileSync(filePath, 'utf8');
    const frames = parseStackTrace(content);
    const frame = firstUserFrame(frames);
    if (!frame) return;

    const resolved = resolveFrame(frame, config);
    if (!resolved) return;

    printSuccess(`Detected: ${resolved.absolutePath}:${resolved.line}`);

    if (options.autoOpen !== false) {
      const editor = config?.editor ?? process.env.EDITOR ?? 'code';
      const cmd = buildEditorCommand(editor, resolved.absolutePath, resolved.line, resolved.column);
      openInEditor(cmd);
    }
  });

  return watcher;
}
