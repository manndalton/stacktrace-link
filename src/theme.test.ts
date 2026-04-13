import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getThemesPath,
  loadThemes,
  saveThemes,
  addTheme,
  removeTheme,
  listThemeNames,
  getActiveTheme,
  Theme,
} from './theme';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'theme-test-'));
}

describe('theme', () => {
  let origHome: string | undefined;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    origHome = process.env.HOME;
    Object.defineProperty(os, 'homedir', { value: () => tmpDir, configurable: true });
    delete process.env.STACKTRACE_THEME;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (origHome !== undefined) process.env.HOME = origHome;
  });

  it('loadThemes returns builtin themes when no file exists', () => {
    const themes = loadThemes();
    expect(themes['default']).toBeDefined();
    expect(themes['minimal']).toBeDefined();
    expect(themes['dark']).toBeDefined();
  });

  it('addTheme persists a custom theme', () => {
    const custom: Theme = {
      name: 'custom',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      info: '\x1b[36m',
      success: '\x1b[32m',
      muted: '\x1b[90m',
      highlight: '\x1b[1m',
      frame: '\x1b[35m',
    };
    addTheme(custom);
    const themes = loadThemes();
    expect(themes['custom']).toEqual(custom);
  });

  it('removeTheme removes a custom theme', () => {
    const custom: Theme = { name: 'myTheme', error: '', warning: '', info: '', success: '', muted: '', highlight: '', frame: '' };
    addTheme(custom);
    const removed = removeTheme('myTheme');
    expect(removed).toBe(true);
    const themes = loadThemes();
    expect(themes['myTheme']).toBeUndefined();
  });

  it('removeTheme returns false for builtin themes', () => {
    expect(removeTheme('default')).toBe(false);
    expect(removeTheme('minimal')).toBe(false);
  });

  it('listThemeNames includes builtins and custom', () => {
    const custom: Theme = { name: 'extra', error: '', warning: '', info: '', success: '', muted: '', highlight: '', frame: '' };
    addTheme(custom);
    const names = listThemeNames();
    expect(names).toContain('default');
    expect(names).toContain('extran  it('getActiveTheme returns default when env not set', () => {
    const theme = getActiveTheme();
    expect(theme.name).toBe('default');
  });
});
