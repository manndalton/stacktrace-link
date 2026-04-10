#!/usr/bin/env node
import { loadHistory, clearHistory, HistoryEntry } from './history';
import { colorize, printError, printInfo } from './output';

const args = process.argv.slice(2);
const command = args[0];

function formatEntry(entry: HistoryEntry, index: number): string {
  const date = new Date(entry.timestamp).toLocaleString();
  const location = colorize(`${entry.file}:${entry.line}${entry.column != null ? `:${entry.column}` : ''}`, 'cyan');
  const editor = colorize(entry.editor, 'yellow');
  const ts = colorize(date, 'dim');
  return `  ${colorize(String(index + 1).padStart(3), 'dim')}  ${location}  [${editor}]  ${ts}`;
}

function runList(): void {
  const entries = loadHistory();
  if (entries.length === 0) {
    printInfo('No history entries found.');
    return;
  }
  console.log(colorize(`\nRecent stack trace opens (${entries.length}):`, 'bold'));
  const recent = entries.slice().reverse().slice(0, 50);
  recent.forEach((entry, i) => {
    console.log(formatEntry(entry, i));
  });
  console.log('');
}

function runClear(): void {
  clearHistory();
  printInfo('History cleared.');
}

function runHelp(): void {
  console.log(`
Usage: stacktrace-history <command>

Commands:
  list    Show recent file opens (default)
  clear   Clear all history
  help    Show this help message
`);
}

switch (command) {
  case undefined:
  case 'list':
    runList();
    break;
  case 'clear':
    runClear();
    break;
  case 'help':
  case '--help':
  case '-h':
    runHelp();
    break;
  default:
    printError(`Unknown command: ${command}`);
    runHelp();
    process.exit(1);
}
