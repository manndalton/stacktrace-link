import { addPin, removePin, loadPins, clearPins, findPin } from './pin';

function printUsage(): void {
  console.log(`Usage: pin <command> [args]

Commands:
  add <label> <file> <line> [col]  Pin a file location
  remove <id>                      Remove a pin by id
  list                             List all pins
  show <id>                        Show a pin
  clear                            Remove all pins
`);
}

function runList(): void {
  const pins = loadPins();
  if (pins.length === 0) { console.log('No pins saved.'); return; }
  for (const p of pins) {
    console.log(`[${p.id}] ${p.label} — ${p.file}:${p.line}${p.column != null ? `:${p.column}` : ''} (${p.createdAt})`);
  }
}

function runAdd(args: string[]): void {
  const [label, file, lineStr, colStr] = args;
  if (!label || !file || !lineStr) { console.error('Usage: pin add <label> <file> <line> [col]'); process.exit(1); }
  const line = parseInt(lineStr, 10);
  const column = colStr ? parseInt(colStr, 10) : undefined;
  const pin = addPin(label, file, line, column);
  console.log(`Pinned: [${pin.id}] ${pin.label} — ${pin.file}:${pin.line}`);
}

function runRemove(args: string[]): void {
  const [id] = args;
  if (!id) { console.error('Usage: pin remove <id>'); process.exit(1); }
  const ok = removePin(id);
  console.log(ok ? `Removed pin ${id}.` : `Pin not found: ${id}`);
}

function runShow(args: string[]): void {
  const [id] = args;
  if (!id) { console.error('Usage: pin show <id>'); process.exit(1); }
  const pin = findPin(id);
  if (!pin) { console.error(`Pin not found: ${id}`); process.exit(1); }
  console.log(JSON.stringify(pin, null, 2));
}

export function runPinCli(argv: string[]): void {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'add': return runAdd(rest);
    case 'remove': return runRemove(rest);
    case 'list': return runList();
    case 'show': return runShow(rest);
    case 'clear': clearPins(); console.log('All pins cleared.'); break;
    default: printUsage();
  }
}

if (require.main === module) {
  runPinCli(process.argv.slice(2));
}
