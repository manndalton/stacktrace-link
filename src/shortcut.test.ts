import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  buildShortcutSnippet,
  getShellConfigPath,
  installShortcut,
  isShortcutInstalled,
  uninstallShortcut,
} from './shortcut';

describe('buildShortcutSnippet', () => {
  it('includes the shortcut key in the comment', () => {
    const snippet = buildShortcutSnippet('ctrl+shift+e');
    expect(snippet).toContain('ctrl+shift+e');
  });

  it('includes the bin name in the alias', () => {
    const snippet = buildShortcutSnippet('ctrl+shift+e', 'my-stl');
    expect(snippet).toContain("alias stl='my-stl'");
    expect(snippet).toContain('my-stl');
  });

  it('includes the stl-clip function', () => {
    const snippet = buildShortcutSnippet('ctrl+shift+e');
    expect(snippet).toContain('stl-clip()');
  });
});

describe('getShellConfigPath', () => {
  it('returns .zshrc for zsh', () => {
    const original = process.env.SHELL;
    process.env.SHELL = '/bin/zsh';
    expect(getShellConfigPath()).toContain('.zshrc');
    process.env.SHELL = original;
  });

  it('returns .bashrc as fallback', () => {
    const original = process.env.SHELL;
    process.env.SHELL = '';
    expect(getShellConfigPath()).toContain('.bashrc');
    process.env.SHELL = original;
  });
});

describe('installShortcut / isShortcutInstalled / uninstallShortcut', () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `stl-test-${Date.now()}.sh`);
    fs.writeFileSync(tmpFile, '# existing config\n', 'utf8');
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it('installs the shortcut and detects it', () => {
    expect(isShortcutInstalled(tmpFile)).toBe(false);
    const installed = installShortcut(tmpFile, 'ctrl+shift+e');
    expect(installed).toBe(true);
    expect(isShortcutInstalled(tmpFile)).toBe(true);
  });

  it('does not install twice', () => {
    installShortcut(tmpFile, 'ctrl+shift+e');
    const second = installShortcut(tmpFile, 'ctrl+shift+e');
    expect(second).toBe(false);
  });

  it('uninstalls the shortcut', () => {
    installShortcut(tmpFile, 'ctrl+shift+e');
    const removed = uninstallShortcut(tmpFile);
    expect(removed).toBe(true);
    expect(isShortcutInstalled(tmpFile)).toBe(false);
    const content = fs.readFileSync(tmpFile, 'utf8');
    expect(content).toContain('# existing config');
  });

  it('returns false when uninstalling from file without shortcut', () => {
    const result = uninstallShortcut(tmpFile);
    expect(result).toBe(false);
  });
});
