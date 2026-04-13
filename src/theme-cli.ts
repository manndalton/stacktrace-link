import {
  loadThemes,
  addTheme,
  removeTheme,
  listThemeNames,
  getActiveTheme,
  Theme,
} from './theme';

export function printUsage(): void {
  console.log(`Usage: stacktrace-link theme <command> [args]

Commands:
  list                  List all available themes
  show <name>           Show theme color codes
  add <name> <json>     Add or update a custom theme
  remove <name>         Remove a custom theme
  active                Show the currently active theme name
  help                  Show this help message`);
}

export function runList(): void {
  const names = listThemeNames();
  if (names.length === 0) {
    console.log('No themes found.');
    return;
  }
  const active = process.env.STACKTRACE_THEME ?? 'default';
  for (const name of names) {
    const marker = name === active ? ' (active)' : '';
    console.log(`  ${name}${marker}`);
  }
}

export function runShow(name: string): void {
  const themes = loadThemes();
  const theme = themes[name];
  if (!theme) {
    console.error(`Theme not found: ${name}`);
    process.exit(1);
  }
  console.log(`Theme: ${theme.name}`);
  const keys: (keyof Theme)[] = ['error', 'warning', 'info', 'success', 'muted', 'highlight', 'frame'];
  for (const key of keys) {
    const val = theme[key] as string;
    const preview = val ? `${val}sample\x1b[0m` : '(none)';
    console.log(`  ${key.padEnd(12)}: ${JSON.stringify(val)} ${preview}`);
  }
}

export function runAdd(name: string, jsonStr: string): void {
  let partial: Partial<Theme>;
  try {
    partial = JSON.parse(jsonStr);
  } catch {
    console.error('Invalid JSON for theme definition.');
    process.exit(1);
  }
  const themes = loadThemes();
  const base = themes[name] ?? themes['default'];
  const theme: Theme = { ...base, ...partial, name };
  addTheme(theme);
  console.log(`Theme '${name}' saved.`);
}

export function runRemove(name: string): void {
  const ok = removeTheme(name);
  if (!ok) {
    console.error(`Cannot remove theme '${name}' (not found or is builtin).`);
    process.exit(1);
  }
  console.log(`Theme '${name}' removed.`);
}

export function runActive(): void {
  const theme = getActiveTheme();
  console.log(`Active theme: ${theme.name}`);
  console.log(`Set STACKTRACE_THEME=<name> to change.`);
}

export function runThemeCli(argv: string[]): void {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'list': return runList();
    case 'show': return runShow(rest[0]);
    case 'add': return runAdd(rest[0], rest.slice(1).join(' '));
    case 'remove': return runRemove(rest[0]);
    case 'active': return runActive();
    case 'help':
    default:
      printUsage();
  }
}
