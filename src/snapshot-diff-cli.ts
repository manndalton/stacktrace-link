#!/usr/bin/env node
import { loadSnapshot, listSnapshots } from './snapshot';
import { diffSnapshots, formatDiff } from './snapshot-diff';
import { printError, printInfo } from './output';

function printUsage(): void {
  console.log('Usage: stacktrace-diff <snapshotId1> <snapshotId2>');
  console.log('');
  console.log('Commands:');
  console.log('  <id1> <id2>   Diff two snapshots by ID');
  console.log('  --list        List available snapshots');
  console.log('  --help        Show this help message');
}

async function runDiff(id1: string, id2: string): Promise<void> {
  const snap1 = await loadSnapshot(id1);
  if (!snap1) {
    printError(`Snapshot not found: ${id1}`);
    process.exit(1);
  }

  const snap2 = await loadSnapshot(id2);
  if (!snap2) {
    printError(`Snapshot not found: ${id2}`);
    process.exit(1);
  }

  const diff = diffSnapshots(snap1, snap2);
  const output = formatDiff(diff);
  console.log(output);
}

async function runList(): Promise<void> {
  const snapshots = await listSnapshots();
  if (snapshots.length === 0) {
    printInfo('No snapshots found.');
    return;
  }
  snapshots.forEach((s) => {
    console.log(`  ${s.id}  ${s.label ?? '(no label)'}  ${new Date(s.createdAt).toLocaleString()}`);
  });
}

export async function runSnapshotDiffCli(argv: string[]): Promise<void> {
  const args = argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    printUsage();
    return;
  }

  if (args.includes('--list')) {
    await runList();
    return;
  }

  if (args.length < 2) {
    printError('Two snapshot IDs are required.');
    printUsage();
    process.exit(1);
  }

  await runDiff(args[0], args[1]);
}

if (require.main === module) {
  runSnapshotDiffCli(process.argv).catch((err) => {
    printError(err.message);
    process.exit(1);
  });
}
