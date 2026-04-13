import * as fs from 'fs';
import * as path from 'path';
import { parseStackTrace } from './parser';
import { exportFrames, ExportFormat } from './export';
import { printError, printSuccess, printInfo } from './output';

const VALID_FORMATS: ExportFormat[] = ['json', 'csv', 'markdown', 'text'];

export function printUsage(): void {
  console.log(`Usage: stacktrace-link export [options]

Export a stack trace to various formats.

Options:
  --format, -f <fmt>   Output format: json, csv, markdown, text (default: json)
  --output, -o <path>  Write output to file instead of stdout
  --metadata           Include export metadata (json format only)
  --input, -i <path>   Read stack trace from file (default: stdin)
  --help, -h           Show this help message
`);
}

export interface ExportArgs {
  format: ExportFormat;
  outputPath?: string;
  inputPath?: string;
  includeMetadata: boolean;
  help: boolean;
}

export function parseArgs(argv: string[]): ExportArgs {
  const args: ExportArgs = { format: 'json', includeMetadata: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') { args.help = true; }
    else if ((arg === '--format' || arg === '-f') && argv[i + 1]) { args.format = argv[++i] as ExportFormat; }
    else if ((arg === '--output' || arg === '-o') && argv[i + 1]) { args.outputPath = argv[++i]; }
    else if ((arg === '--input' || arg === '-i') && argv[i + 1]) { args.inputPath = argv[++i]; }
    else if (arg === '--metadata') { args.includeMetadata = true; }
  }
  return args;
}

export async function runExportCli(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  if (args.help) { printUsage(); return; }
  if (!VALID_FORMATS.includes(args.format)) {
    printError(`Invalid format "${args.format}". Valid: ${VALID_FORMATS.join(', ')}`);
    process.exit(1);
  }
  let input: string;
  if (args.inputPath) {
    if (!fs.existsSync(args.inputPath)) { printError(`File not found: ${args.inputPath}`); process.exit(1); }
    input = fs.readFileSync(args.inputPath, 'utf8');
  } else {
    input = fs.readFileSync('/dev/stdin', 'utf8');
  }
  const frames = parseStackTrace(input);
  if (frames.length === 0) { printError('No stack frames found in input.'); process.exit(1); }
  const result = exportFrames(frames, { format: args.format, outputPath: args.outputPath, includeMetadata: args.includeMetadata });
  if (args.outputPath) {
    printSuccess(`Exported ${result.frameCount} frames to ${args.outputPath}`);
  } else {
    process.stdout.write(result.content + '\n');
  }
}
