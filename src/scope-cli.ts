import { addScope, removeScope, setActiveScope, getActiveScope, loadScopes } from './scope';

export function printUsage(): void {
  console.log(`Usage: stacktrace-link scope <command> [options]

Commands:
  add <name> <rootDir> [--include <p>] [--exclude <p>]  Add a scope
  remove <name>                                          Remove a scope
  use <name>                                             Set active scope
  clear                                                  Clear active scope
  list                                                   List all scopes
  show                                                   Show active scope
`);
}

function parseInclExcl(args: string[], flag: string): string[] {
  const result: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === flag && args[i + 1]) result.push(args[++i]);
  }
  return result;
}

export function runScopeAdd(args: string[]): void {
  const [name, rootDir, ...rest] = args;
  if (!name || !rootDir) { console.error('Usage: scope add <name> <rootDir>'); process.exit(1); }
  const include = parseInclExcl(rest, '--include');
  const exclude = parseInclExcl(rest, '--exclude');
  const entry = addScope(name, rootDir, include, exclude);
  console.log(`Scope '${entry.name}' added (root: ${entry.rootDir})`);
}

export function runScopeRemove(args: string[]): void {
  const [name] = args;
  if (!name) { console.error('Name required'); process.exit(1); }
  if (!removeScope(name)) { console.error(`Scope not found: ${name}`); process.exit(1); }
  console.log(`Scope '${name}' removed`);
}

export function runScopeUse(args: string[]): void {
  const [name] = args;
  if (!name) { console.error('Name required'); process.exit(1); }
  try { setActiveScope(name); console.log(`Active scope set to '${name}'`); }
  catch (e: any) { console.error(e.message); process.exit(1); }
}

export function runScopeList(): void {
  const store = loadScopes();
  const names = Object.keys(store.scopes);
  if (names.length === 0) { console.log('No scopes defined.'); return; }
  for (const n of names) {
    const s = store.scopes[n];
    const marker = store.active === n ? '* ' : '  ';
    console.log(`${marker}${n}  root=${s.rootDir}`);
  }
}

export function runScopeShow(): void {
  const active = getActiveScope();
  if (!active) { console.log('No active scope.'); return; }
  console.log(`Name:    ${active.name}`);
  console.log(`Root:    ${active.rootDir}`);
  console.log(`Include: ${active.include.join(', ') || '(all)'}`);
  console.log(`Exclude: ${active.exclude.join(', ') || '(none)'}`);
}

export function runScopeCli(argv: string[]): void {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'add': return runScopeAdd(rest);
    case 'remove': return runScopeRemove(rest);
    case 'use': return runScopeUse(rest);
    case 'clear': setActiveScope(null); console.log('Active scope cleared.'); break;
    case 'list': return runScopeList();
    case 'show': return runScopeShow();
    default: printUsage();
  }
}
