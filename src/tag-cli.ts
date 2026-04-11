import { addTag, removeTag, loadTags, getSnapshotsByTag } from './tag';

export function printUsage(): void {
  console.log(`Usage: stacktrace-link tag <command> [args]

Commands:
  add <name> <snapshotId>   Tag a snapshot with a name
  remove <name> [id]        Remove a tag (optionally from one snapshot)
  list                      List all tags
  show <name>               Show snapshot IDs for a tag
`);
}

export function runAdd(args: string[]): void {
  const [name, snapshotId] = args;
  if (!name || !snapshotId) {
    console.error('Usage: tag add <name> <snapshotId>');
    process.exit(1);
  }
  addTag(name, snapshotId);
  console.log(`Tagged snapshot "${snapshotId}" with "${name}".`);
}

export function runRemove(args: string[]): void {
  const [name, snapshotId] = args;
  if (!name) {
    console.error('Usage: tag remove <name> [snapshotId]');
    process.exit(1);
  }
  const removed = removeTag(name, snapshotId);
  if (!removed) {
    console.error(`Tag "${name}" not found.`);
    process.exit(1);
  }
  const msg = snapshotId
    ? `Removed snapshot "${snapshotId}" from tag "${name}".`
    : `Removed tag "${name}".`;
  console.log(msg);
}

export function runList(): void {
  const tags = loadTags();
  const names = Object.keys(tags);
  if (names.length === 0) {
    console.log('No tags found.');
    return;
  }
  names.forEach(name => {
    console.log(`${name} (${tags[name].snapshotIds.length} snapshot(s))`);
  });
}

export function runShow(args: string[]): void {
  const [name] = args;
  if (!name) {
    console.error('Usage: tag show <name>');
    process.exit(1);
  }
  const ids = getSnapshotsByTag(name);
  if (ids.length === 0) {
    console.log(`No snapshots tagged with "${name}".`);
    return;
  }
  ids.forEach(id => console.log(id));
}

export function runTagCli(argv: string[]): void {
  const [command, ...args] = argv;
  switch (command) {
    case 'add': return runAdd(args);
    case 'remove': return runRemove(args);
    case 'list': return runList();
    case 'show': return runShow(args);
    default: printUsage();
  }
}
