import { addProfile, removeProfile, setActiveProfile, getActiveProfile, loadProfiles } from './profile';

export function printUsage(): void {
  console.log(`Usage: stacktrace-link profile <command> [options]

Commands:
  list                    List all profiles
  add <name> [options]    Add a new profile
  remove <name>           Remove a profile
  use <name>              Set the active profile
  show [name]             Show profile details
  clear                   Unset the active profile

Options for add:
  --editor <editor>       Editor to use
  --root <dir>            Project root directory
  --filter <pattern>      Filter pattern (repeatable)
`);
}

export function runList(): void {
  const store = loadProfiles();
  const names = Object.keys(store.profiles);
  if (names.length === 0) {
    console.log('No profiles defined.');
    return;
  }
  for (const name of names) {
    const marker = store.active === name ? '* ' : '  ';
    console.log(`${marker}${name}`);
  }
}

export function runAdd(args: string[]): void {
  const name = args[0];
  if (!name) { console.error('Profile name required.'); process.exit(1); }
  const editorIdx = args.indexOf('--editor');
  const rootIdx = args.indexOf('--root');
  const filters: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--filter' && args[i + 1]) filters.push(args[++i]);
  }
  const profile = addProfile(name, {
    editor: editorIdx >= 0 ? args[editorIdx + 1] : undefined,
    rootDir: rootIdx >= 0 ? args[rootIdx + 1] : undefined,
    filters: filters.length ? filters : undefined,
  });
  console.log(`Profile '${profile.name}' added.`);
}

export function runRemove(args: string[]): void {
  const name = args[0];
  if (!name) { console.error('Profile name required.'); process.exit(1); }
  if (removeProfile(name)) console.log(`Profile '${name}' removed.`);
  else console.error(`Profile '${name}' not found.`);
}

export function runShow(args: string[]): void {
  const store = loadProfiles();
  const name = args[0] ?? store.active;
  if (!name) { console.log('No active profile.'); return; }
  const profile = store.profiles[name];
  if (!profile) { console.error(`Profile '${name}' not found.`); return; }
  console.log(JSON.stringify(profile, null, 2));
}

export function runProfileCli(args: string[]): void {
  const [cmd, ...rest] = args;
  switch (cmd) {
    case 'list': runList(); break;
    case 'add': runAdd(rest); break;
    case 'remove': runRemove(rest); break;
    case 'use': {
      const name = rest[0];
      if (!name) { console.error('Profile name required.'); process.exit(1); }
      if (setActiveProfile(name)) console.log(`Active profile set to '${name}'.`);
      else console.error(`Profile '${name}' not found.`);
      break;
    }
    case 'clear':
      setActiveProfile(null);
      console.log('Active profile cleared.');
      break;
    case 'show': runShow(rest); break;
    default: printUsage();
  }
}
