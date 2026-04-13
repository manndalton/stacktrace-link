import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runList, runShow, runAdd, runRemove, runActive } from './theme-cli';
import { addTheme, Theme } from './theme';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'theme-cli-test-'));
}

describe('theme-cli', () => {
  let tmpDir: string;
  let logs: string[];
  let errors: string[];

  beforeEach(() => {
    tmpDir = makeTempDir();
    Object.defineProperty(os, 'homedir', { value: () => tmpDir, configurable: true });
    delete process.env.STACKTRACE_THEME;
    logs = [];
    errors = [];
    jest.spyOn(console, 'log').mockImplementation((...args) => logs.push(args.join(' ')));
    jest.spyOn(console, 'error').mockImplementation((...args) => errors.push(args.join(' ')));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('runList shows builtin themes', () => {
    runList();
    const out = logs.join('\n');
    expect(out).toContain('default');
    expect(out).toContain('minimal');
    expect(out).toContain('dark');
  });

  it('runList marks active theme', () => {
    process.env.STACKTRACE_THEME = 'dark';
    runList();
    const out = logs.join('\n');
    expect(out).toContain('dark (active)');
  });

  it('runShow displays theme properties', () => {
    runShow('minimal');
    const out = logs.join('\n');
    expect(out).toContain('Theme: minimal');
    expect(out).toContain('error');
  });

  it('runShow exits on unknown theme', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runShow('nonexistent')).toThrow('exit');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('runAdd creates a new theme', () => {
    runAdd('mytest', JSON.stringify({ error: '\x1b[31m' }));
    expect(logs.join('\n')).toContain("Theme 'mytest' saved.");
  });

  it('runAdd exits on invalid JSON', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runAdd('bad', 'not-json')).toThrow('exit');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('runRemove removes a custom theme', () => {
    const t: Theme = { name: 'tmp', error: '', warning: '', info: '', success: '', muted: '', highlight: '', frame: '' };
    addTheme(t);
    runRemove('tmp');
    expect(logs.join('\n')).toContain("Theme 'tmp' removed.");
  });

  it('runRemove exits for builtin theme', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runRemove('default')).toThrow('exit');
  });

  it('runActive shows active theme name', () => {
    runActive();
    expect(logs.join('\n')).toContain('Active theme: default');
  });
});
