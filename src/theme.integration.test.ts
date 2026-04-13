import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { addTheme, loadThemes, removeTheme, getActiveTheme, Theme } from './theme';
import { runThemeCli } from './theme-cli';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'theme-int-'));
}

describe('theme integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    Object.defineProperty(os, 'homedir', { value: () => tmpDir, configurable: true });
    delete process.env.STACKTRACE_THEME;
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('add then list then remove round-trip', () => {
    const t: Theme = { name: 'roundtrip', error: '\x1b[31m', warning: '', info: '', success: '', muted: '', highlight: '', frame: '' };
    addTheme(t);
    let themes = loadThemes();
    expect(themes['roundtrip']).toEqual(t);
    const removed = removeTheme('roundtrip');
    expect(removed).toBe(true);
    themes = loadThemes();
    expect(themes['roundtrip']).toBeUndefined();
  });

  it('runThemeCli add + show round-trip', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    runThemeCli(['add', 'cli-theme', JSON.stringify({ error: '\x1b[91m' })]);
    const themes = loadThemes();
    expect(themes['cli-theme']).toBeDefined();
    expect(themes['cli-theme'].error).toBe('\x1b[91m');
  });

  it('getActiveTheme respects STACKTRACE_THEME env', () => {
    const t: Theme = { name: 'envtheme', error: '\x1b[34m', warning: '', info: '', success: '', muted: '', highlight: '', frame: '' };
    addTheme(t);
    process.env.STACKTRACE_THEME = 'envtheme';
    const active = getActiveTheme();
    expect(active.name).toBe('envtheme');
    expect(active.error).toBe('\x1b[34m');
  });

  it('multiple custom themes persist independently', () => {
    const t1: Theme = { name: 'alpha', error: '', warning: '', info: '', success: '', muted: '', highlight: '', frame: '' };
    const t2: Theme = { name: 'beta', error: '\x1b[35m', warning: '', info: '', success: '', muted: '', highlight: '', frame: '' };
    addTheme(t1);
    addTheme(t2);
    const themes = loadThemes();
    expect(themes['alpha']).toEqual(t1);
    expect(themes['beta']).toEqual(t2);
    removeTheme('alpha');
    const after = loadThemes();
    expect(after['alpha']).toBeUndefined();
    expect(after['beta']).toEqual(t2);
  });
});
