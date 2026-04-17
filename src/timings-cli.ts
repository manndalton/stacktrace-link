import { loadTimings, clearTimings, computeAverageDuration, TimingEntry } from './timings';

function printUsage(): void {
  console.log('Usage: timings <list|stats|clear>');
}

function formatEntry(e: TimingEntry): string {
  return `[${e.id}] ${e.label} — ${e.duration}ms, ${e.frameCount} frames`;
}

function runList(): void {
  const entries = loadTimings();
  if (entries.length === 0) {
    console.log('No timing entries.');
    return;
  }
  entries.forEach(e => console.log(formatEntry(e)));
}

function runStats(): void {
  const entries = loadTimings();
  if (entries.length === 0) {
    console.log('No data.');
    return;
  }
  const avg = computeAverageDuration(entries).toFixed(2);
  const max = Math.max(...entries.map(e => e.duration));
  const min = Math.min(...entries.map(e => e.duration));
  console.log(`Count : ${entries.length}`);
  console.log(`Avg   : ${avg}ms`);
  console.log(`Min   : ${min}ms`);
  console.log(`Max   : ${max}ms`);
}

function runClear(): void {
  clearTimings();
  console.log('Timings cleared.');
}

export function runTimingsCli(argv: string[]): void {
  const cmd = argv[0];
  switch (cmd) {
    case 'list': return runList();
    case 'stats': return runStats();
    case 'clear': return runClear();
    default: printUsage();
  }
}

if (require.main === module) {
  runTimingsCli(process.argv.slice(2));
}
