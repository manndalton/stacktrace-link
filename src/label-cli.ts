import { addLabel, removeLabel, listLabels, getLabel } from './label';

export function printUsage(): void {
  console.log(`Usage: stacktrace-link label <command> [options]

Commands:
  add <name> [--color <color>] [--desc <text>]  Add a new label
  remove <name>                                  Remove a label by name
  list                                           List all labels
  show <name>                                    Show details of a label
  help                                           Show this help message
`);
}

export function runAdd(args: string[]): void {
  const name = args[0];
  if (!name) { console.error('Error: label name required'); process.exit(1); }
  let color: string | undefined;
  let description: string | undefined;
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--color' && args[i + 1]) { color = args[++i]; }
    if (args[i] === '--desc' && args[i + 1]) { description = args[++i]; }
  }
  const label = addLabel(name, color, description);
  console.log(`Added label: ${label.name}${color ? ` (${color})` : ''}`);
}

export function runRemove(args: string[]): void {
  const name = args[0];
  if (!name) { console.error('Error: label name required'); process.exit(1); }
  const removed = removeLabel(name);
  if (removed) console.log(`Removed label: ${name}`);
  else console.error(`Label not found: ${name}`);
}

export function runList(): void {
  const labels = listLabels();
  if (labels.length === 0) { console.log('No labels defined.'); return; }
  for (const l of labels) {
    const parts = [l.name];
    if (l.color) parts.push(`color=${l.color}`);
    if (l.description) parts.push(l.description);
    console.log(`  ${parts.join('  ')}`);
  }
}

export function runShow(args: string[]): void {
  const name = args[0];
  if (!name) { console.error('Error: label name required'); process.exit(1); }
  const label = getLabel(name);
  if (!label) { console.error(`Label not found: ${name}`); process.exit(1); }
  console.log(JSON.stringify(label, null, 2));
}

export function runLabelCli(argv: string[]): void {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'add': return runAdd(rest);
    case 'remove': return runRemove(rest);
    case 'list': return runList();
    case 'show': return runShow(rest);
    default: printUsage();
  }
}
