import {
  addAnnotation,
  removeAnnotation,
  listAnnotations,
  getAnnotationsForFrame,
  Annotation,
} from './annotate';
import { parseStackTrace, firstUserFrame } from './parser';

export function printUsage(): void {
  console.log(`Usage: stacktrace-link annotate <command> [options]

Commands:
  add <file> <line> <text>   Add annotation to a file:line
  remove <file> <line>       Remove annotation from a file:line
  list                       List all annotations
  show <file> <line>         Show annotations for a file:line
  scan                       Scan stdin stack trace for annotations

Options:
  --author <name>            Set author for add command
  --col <number>             Set column for add command
`);
}

export function formatAnnotation(a: Annotation): string {
  const loc = `${a.file}:${a.line}${a.col != null ? `:${a.col}` : ''}`;
  const who = a.author ? ` [${a.author}]` : '';
  return `${loc}${who} — ${a.text}  (${a.createdAt})`;
}

export function runAdd(args: string[]): void {
  const authorIdx = args.indexOf('--author');
  const author = authorIdx !== -1 ? args.splice(authorIdx, 2)[1] : undefined;
  const colIdx = args.indexOf('--col');
  const col = colIdx !== -1 ? parseInt(args.splice(colIdx, 2)[1], 10) : undefined;
  const [file, lineStr, ...rest] = args;
  const text = rest.join(' ');
  if (!file || !lineStr || !text) {
    console.error('Usage: annotate add <file> <line> <text> [--author name] [--col n]');
    process.exit(1);
  }
  const line = parseInt(lineStr, 10);
  const a = addAnnotation(file, line, text, col, author);
  console.log('Annotation added:', formatAnnotation(a));
}

export function runRemove(args: string[]): void {
  const [file, lineStr] = args;
  if (!file || !lineStr) {
    console.error('Usage: annotate remove <file> <line>');
    process.exit(1);
  }
  const removed = removeAnnotation(file, parseInt(lineStr, 10));
  console.log(removed ? 'Annotation removed.' : 'No annotation found.');
}

export function runList(): void {
  const all = listAnnotations();
  if (all.length === 0) { console.log('No annotations.'); return; }
  all.forEach((a) => console.log(formatAnnotation(a)));
}

export function runShow(args: string[]): void {
  const [file, lineStr] = args;
  if (!file || !lineStr) { console.error('Usage: annotate show <file> <line>'); process.exit(1); }
  const results = getAnnotationsForFrame({ file, line: parseInt(lineStr, 10), col: 0, raw: '' });
  if (results.length === 0) { console.log('No annotations for this location.'); return; }
  results.forEach((a) => console.log(formatAnnotation(a)));
}

export function runScan(): void {
  const input = fs.readFileSync('/dev/stdin', 'utf8');
  const frames = parseStackTrace(input);
  let found = 0;
  for (const frame of frames) {
    const anns = getAnnotationsForFrame(frame);
    for (const a of anns) { console.log(formatAnnotation(a)); found++; }
  }
  if (found === 0) console.log('No annotations matched frames in stack trace.');
}

import * as fs from 'fs';

export function runAnnotateCli(argv: string[]): void {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'add': return runAdd(rest);
    case 'remove': return runRemove(rest);
    case 'list': return runList();
    case 'show': return runShow(rest);
    case 'scan': return runScan();
    default: printUsage();
  }
}
