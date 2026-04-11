import { loadAliases, saveAliases, addAlias, removeAlias } from './alias';
import { printSuccess, printError, printInfo } from './output';

function printUsage(): void {
  printInfo('Usage: stacktrace-alias <command> [args]');
  printInfo('');
  printInfo('Commands:');
  printInfo('  list                   List all configured aliases');
  printInfo('  add <alias> <target>   Add or update an alias mapping');
  printInfo('  remove <alias>         Remove an alias');
  printInfo('  help                   Show this help message');
}

export function runList(): void {
  const aliases = loadAliases();
  const entries = Object.entries(aliases);
  if (entries.length === 0) {
    printInfo('No aliases configured.');
    return;
  }
  for (const [alias, target] of entries) {
    printInfo(`  ${alias}  →  ${target}`);
  }
}

export function runAdd(alias: string | undefined, target: string | undefined): void {
  if (!alias || !target) {
    printError('Usage: stacktrace-alias add <alias> <target>');
    process.exit(1);
  }
  const aliases = loadAliases();
  const updated = addAlias(alias, target, aliases);
  saveAliases(updated);
  printSuccess(`Alias added: ${alias}  →  ${target}`);
}

export function runRemove(alias: string | undefined): void {
  if (!alias) {
    printError('Usage: stacktrace-alias remove <alias>');
    process.exit(1);
  }
  const aliases = loadAliases();
  if (!(alias in aliases)) {
    printError(`Alias not found: ${alias}`);
    process.exit(1);
  }
  const updated = removeAlias(alias, aliases);
  saveAliases(updated);
  printSuccess(`Alias removed: ${alias}`);
}

export function runAliasCli(argv: string[]): void {
  const [command, ...rest] = argv;
  switch (command) {
    case 'list':
      runList();
      break;
    case 'add':
      runAdd(rest[0], rest[1]);
      break;
    case 'remove':
      runRemove(rest[0]);
      break;
    case 'help':
    default:
      printUsage();
  }
}

if (require.main === module) {
  runAliasCli(process.argv.slice(2));
}
