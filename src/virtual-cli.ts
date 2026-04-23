import {
  addVirtualMapping,
  removeVirtualMapping,
  listVirtualMappings,
  resolveVirtualPath,
} from './virtual';

function printUsage(): void {
  console.log('Usage: stacktrace-link virtual <command> [args]');
  console.log('');
  console.log('Commands:');
  console.log('  add <alias> <real-path>   Register a virtual path mapping');
  console.log('  remove <alias>            Remove a virtual path mapping');
  console.log('  list                      List all virtual path mappings');
  console.log('  resolve <path>            Resolve a virtual path to its real path');
}

export function runAdd(alias: string, realPath: string): void {
  if (!alias || !realPath) {
    console.error('Error: alias and real-path are required');
    process.exit(1);
  }
  addVirtualMapping(alias, realPath);
  console.log(`Mapped ${alias} -> ${realPath}`);
}

export function runRemove(alias: string): void {
  if (!alias) {
    console.error('Error: alias is required');
    process.exit(1);
  }
  const ok = removeVirtualMapping(alias);
  if (!ok) {
    console.error(`No mapping found for alias: ${alias}`);
    process.exit(1);
  }
  console.log(`Removed mapping for ${alias}`);
}

export function runList(): void {
  const mappings = listVirtualMappings();
  if (mappings.length === 0) {
    console.log('No virtual mappings registered.');
    return;
  }
  for (const m of mappings) {
    console.log(`${m.alias}  ->  ${m.realPath}`);
  }
}

export function runResolve(filePath: string): void {
  if (!filePath) {
    console.error('Error: path is required');
    process.exit(1);
  }
  console.log(resolveVirtualPath(filePath));
}

export function runVirtualCli(argv: string[]): void {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'add': return runAdd(rest[0], rest[1]);
    case 'remove': return runRemove(rest[0]);
    case 'list': return runList();
    case 'resolve': return runResolve(rest[0]);
    default: printUsage();
  }
}
