import { parseStackTrace, firstUserFrame } from './parser';
import { buildChain, formatChain, chainDepth } from './chain';
import { printError, printInfo } from './output';

function printUsage() {
  console.log('Usage: stacktrace-link chain [options]');
  console.log('');
  console.log('Read a stack trace from stdin and display it as a call chain tree.');
  console.log('');
  console.log('Options:');
  console.log('  --depth <n>   Limit chain display to N levels deep');
  console.log('  --summary     Print only depth and root frame info');
  console.log('  --help        Show this help message');
}

export async function runChainCli(argv: string[]): Promise<void> {
  if (argv.includes('--help')) {
    printUsage();
    return;
  }

  const depthIdx = argv.indexOf('--depth');
  const maxDepth = depthIdx !== -1 ? parseInt(argv[depthIdx + 1], 10) : Infinity;
  const summary = argv.includes('--summary');

  const chunks: Buffer[] = [];
  process.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));

  await new Promise<void>((resolve, reject) => {
    process.stdin.on('end', resolve);
    process.stdin.on('error', reject);
  });

  const input = Buffer.concat(chunks).toString('utf8');
  const frames = parseStackTrace(input);

  if (frames.length === 0) {
    printError('No stack frames found in input.');
    process.exitCode = 1;
    return;
  }

  const chain = buildChain(frames);
  if (!chain) {
    printError('Failed to build chain.');
    process.exitCode = 1;
    return;
  }

  if (summary) {
    const root = firstUserFrame(frames);
    const depth = chainDepth(chain);
    printInfo(`Chain depth: ${depth}`);
    if (root) {
      printInfo(`Root user frame: ${root.fn ?? '<anonymous>'} at ${root.file}:${root.line}`);
    }
    return;
  }

  const formatted = formatChain(chain);
  const lines = formatted.split('\n');
  const limited = isFinite(maxDepth)
    ? lines.filter(l => (l.match(/^(  )*/)?.[0].length ?? 0) / 2 <= maxDepth)
    : lines;

  console.log(limited.join('\n'));
}
