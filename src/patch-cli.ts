import * as fs from 'fs';
import * as path from 'path';
import { parseUnifiedDiff, applyPatch, extractPatchForFrame } from './patch';

function printUsage(): void {
  console.log(`Usage: stacktrace-patch <command> [options]

Commands:
  apply <diff-file> [base-dir]   Apply a unified diff to files
  show <file> <line> [context]   Show patch context around a frame location
  help                           Show this help
`);
}

function runApply(args: string[]): void {
  const diffFile = args[0];
  const baseDir = args[1] || process.cwd();
  if (!diffFile) { printUsage(); process.exit(1); }
  if (!fs.existsSync(diffFile)) {
    console.error(`Diff file not found: ${diffFile}`);
    process.exit(1);
  }
  const diff = fs.readFileSync(diffFile, 'utf8');
  const patches = parseUnifiedDiff(diff);
  for (const patch of patches) {
    applyPatch(patch, baseDir);
    console.log(`Applied patch to ${patch.file}`);
  }
}

function runShow(args: string[]): void {
  const file = args[0];
  const line = parseInt(args[1], 10);
  const context = args[2] ? parseInt(args[2], 10) : 2;
  if (!file || isNaN(line)) { printUsage(); process.exit(1); }
  const result = extractPatchForFrame(path.resolve(file), line, context);
  if (!result) {
    console.error(`Could not read file: ${file}`);
    process.exit(1);
  }
  console.log(result);
}

export function runPatchCli(argv: string[] = process.argv.slice(2)): void {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'apply': return runApply(rest);
    case 'show': return runShow(rest);
    case 'help': return printUsage();
    default: printUsage(); process.exit(1);
  }
}

if (require.main === module) runPatchCli();
