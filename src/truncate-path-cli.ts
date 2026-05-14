import { truncatePath, shortenCwd, TruncatePathOptions } from './truncate-path';

function printUsage(): void {
  console.log(`
Usage: truncate-path [options] <path...>

Options:
  --max <n>        Maximum path length (default: 60)
  --no-filename    Do not preserve the filename segment
  --shorten-cwd    Strip current working directory prefix
  --help           Show this help message

Examples:
  truncate-path --max 40 /home/user/projects/deep/nested/file.ts
  truncate-path --shorten-cwd /home/user/project/src/index.ts
`.trim());
}

export function parseArgs(argv: string[]): {
  paths: string[];
  options: TruncatePathOptions;
  shortenCwdFlag: boolean;
} {
  const paths: string[] = [];
  const options: TruncatePathOptions = {};
  let shortenCwdFlag = false;
  let i = 0;

  while (i < argv.length) {
    const arg = argv[i];
    if (arg === '--max' && argv[i + 1]) {
      options.maxLength = parseInt(argv[++i], 10);
    } else if (arg === '--no-filename') {
      options.keepFilename = false;
    } else if (arg === '--shorten-cwd') {
      shortenCwdFlag = true;
    } else if (arg === '--help') {
      printUsage();
      process.exit(0);
    } else if (!arg.startsWith('--')) {
      paths.push(arg);
    }
    i++;
  }

  return { paths, options, shortenCwdFlag };
}

export function runTruncatePathCli(argv: string[]): void {
  const { paths, options, shortenCwdFlag } = parseArgs(argv);

  if (paths.length === 0) {
    printUsage();
    process.exit(1);
  }

  for (const p of paths) {
    const resolved = shortenCwdFlag ? shortenCwd(p) : p;
    console.log(truncatePath(resolved, options));
  }
}

if (require.main === module) {
  runTruncatePathCli(process.argv.slice(2));
}
