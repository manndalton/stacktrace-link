import { addBadge, removeBadge, loadBadges, getBadge, formatBadgeSvg } from './badge';

function printUsage(): void {
  console.log(`Usage: stacktrace-link badge <command> [options]

Commands:
  add <label> <color> [frameFile]  Add a new badge
  remove <id>                      Remove a badge by ID
  list                             List all badges
  show <id>                        Show badge details
  svg <id>                         Print SVG for a badge
  help                             Show this help
`);
}

function runAdd(args: string[]): void {
  const [label, color, frameFile] = args;
  if (!label || !color) {
    console.error('Error: label and color are required');
    process.exit(1);
  }
  const badge = addBadge(label, color, frameFile);
  console.log(`Badge added: ${badge.id}`);
}

function runRemove(args: string[]): void {
  const [id] = args;
  if (!id) { console.error('Error: id is required'); process.exit(1); }
  const ok = removeBadge(id);
  if (!ok) { console.error(`Badge not found: ${id}`); process.exit(1); }
  console.log(`Badge removed: ${id}`);
}

function runList(): void {
  const badges = loadBadges();
  if (badges.length === 0) { console.log('No badges found.'); return; }
  for (const b of badges) {
    console.log(`[${b.id}] ${b.label} (${b.color})${b.frameFile ? ' -> ' + b.frameFile : ''}`);
  }
}

function runShow(args: string[]): void {
  const [id] = args;
  if (!id) { console.error('Error: id is required'); process.exit(1); }
  const badge = getBadge(id);
  if (!badge) { console.error(`Badge not found: ${id}`); process.exit(1); }
  console.log(JSON.stringify(badge, null, 2));
}

function runSvg(args: string[]): void {
  const [id] = args;
  if (!id) { console.error('Error: id is required'); process.exit(1); }
  const badge = getBadge(id);
  if (!badge) { console.error(`Badge not found: ${id}`); process.exit(1); }
  console.log(formatBadgeSvg(badge));
}

export function runBadgeCli(argv: string[]): void {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'add': return runAdd(rest);
    case 'remove': return runRemove(rest);
    case 'list': return runList();
    case 'show': return runShow(rest);
    case 'svg': return runSvg(rest);
    default: printUsage();
  }
}
