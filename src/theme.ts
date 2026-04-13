import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Theme {
  name: string;
  error: string;
  warning: string;
  info: string;
  success: string;
  muted: string;
  highlight: string;
  frame: string;
}

const DEFAULT_THEME: Theme = {
  name: 'default',
  error: '\x1b[31m',
  warning: '\x1b[33m',
  info: '\x1b[36m',
  success: '\x1b[32m',
  muted: '\x1b[90m',
  highlight: '\x1b[1;37m',
  frame: '\x1b[35m',
};

const BUILTIN_THEMES: Record<string, Theme> = {
  default: DEFAULT_THEME,
  minimal: {
    name: 'minimal',
    error: '',
    warning: '',
    info: '',
    success: '',
    muted: '',
    highlight: '',
    frame: '',
  },
  dark: {
    name: 'dark',
    error: '\x1b[91m',
    warning: '\x1b[93m',
    info: '\x1b[94m',
    success: '\x1b[92m',
    muted: '\x1b[37m',
    highlight: '\x1b[1;97m',
    frame: '\x1b[95m',
  },
};

export function getThemesPath(): string {
  return path.join(os.homedir(), '.stacktrace-link', 'themes.json');
}

export function loadThemes(): Record<string, Theme> {
  const p = getThemesPath();
  if (!fs.existsSync(p)) return { ...BUILTIN_THEMES };
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    return { ...BUILTIN_THEMES, ...raw };
  } catch {
    return { ...BUILTIN_THEMES };
  }
}

export function saveThemes(themes: Record<string, Theme>): void {
  const p = getThemesPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const custom: Record<string, Theme> = {};
  for (const [k, v] of Object.entries(themes)) {
    if (!BUILTIN_THEMES[k]) custom[k] = v;
  }
  fs.writeFileSync(p, JSON.stringify(custom, null, 2));
}

export function getActiveTheme(): Theme {
  const name = process.env.STACKTRACE_THEME ?? 'default';
  const themes = loadThemes();
  return themes[name] ?? DEFAULT_THEME;
}

export function addTheme(theme: Theme): void {
  const themes = loadThemes();
  themes[theme.name] = theme;
  saveThemes(themes);
}

export function removeTheme(name: string): boolean {
  if (BUILTIN_THEMES[name]) return false;
  const themes = loadThemes();
  if (!themes[name]) return false;
  delete themes[name];
  saveThemes(themes);
  return true;
}

export function listThemeNames(): string[] {
  return Object.keys(loadThemes());
}
