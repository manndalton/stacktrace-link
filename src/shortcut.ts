import { execSync } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export interface ShortcutConfig {
  key: string;
  description: string;
  command: string;
}

export const DEFAULT_SHORTCUT = 'ctrl+shift+e';

export function getShellConfigPath(): string {
  const shell = process.env.SHELL || '';
  const home = os.homedir();
  if (shell.includes('zsh')) return path.join(home, '.zshrc');
  if (shell.includes('fish')) return path.join(home, '.config', 'fish', 'config.fish');
  return path.join(home, '.bashrc');
}

export function buildShortcutSnippet(shortcut: string, binName = 'stacktrace-link'): string {
  const lines = [
    `# stacktrace-link keyboard shortcut (${shortcut})`,
    `# Pipes clipboard content through stacktrace-link`,
    `alias stl='${binName}'`,
    `stl-clip() { pbpaste 2>/dev/null || xclip -selection clipboard -o 2>/dev/null | ${binName}; }`,
  ];
  return lines.join('\n');
}

export function isShortcutInstalled(configPath: string): boolean {
  if (!fs.existsSync(configPath)) return false;
  const content = fs.readFileSync(configPath, 'utf8');
  return content.includes('stacktrace-link keyboard shortcut');
}

export function installShortcut(configPath: string, shortcut: string, binName = 'stacktrace-link'): boolean {
  if (isShortcutInstalled(configPath)) return false;
  const snippet = '\n' + buildShortcutSnippet(shortcut, binName) + '\n';
  fs.appendFileSync(configPath, snippet, 'utf8');
  return true;
}

export function uninstallShortcut(configPath: string): boolean {
  if (!fs.existsSync(configPath)) return false;
  const content = fs.readFileSync(configPath, 'utf8');
  const marker = '# stacktrace-link keyboard shortcut';
  if (!content.includes(marker)) return false;
  const lines = content.split('\n');
  const filtered = lines.filter((line, i) => {
    if (line.startsWith(marker)) return false;
    if (line.startsWith('# Pipes clipboard')) return false;
    if (line.startsWith("alias stl='")) return false;
    if (line.startsWith('stl-clip()')) return false;
    return true;
  });
  fs.writeFileSync(configPath, filtered.join('\n'), 'utf8');
  return true;
}
