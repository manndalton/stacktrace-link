import * as fs from 'fs';
import * as path from 'path';

export interface EnvInfo {
  nodeVersion: string;
  platform: string;
  cwd: string;
  editor: string | undefined;
  configFile: string | undefined;
  historyFile: string | undefined;
  snapshotDir: string | undefined;
}

export function getNodeVersion(): string {
  return process.version;
}

export function getPlatform(): string {
  return process.platform;
}

export function getEditorEnv(): string | undefined {
  return process.env.STACKTRACE_EDITOR ||
    process.env.VISUAL ||
    process.env.EDITOR;
}

export function pathExistsSync(p: string): boolean {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

export function collectEnvInfo(): EnvInfo {
  const cwd = process.cwd();

  const configCandidates = [
    path.join(cwd, '.stacktrace-linkrc'),
    path.join(cwd, 'stacktrace-link.config.json'),
    path.join(process.env.HOME || '', '.stacktrace-linkrc'),
  ];
  const configFile = configCandidates.find(pathExistsSync);

  const historyFile = path.join(
    process.env.HOME || '',
    '.stacktrace-link',
    'history.json'
  );

  const snapshotDir = path.join(
    process.env.HOME || '',
    '.stacktrace-link',
    'snapshots'
  );

  return {
    nodeVersion: getNodeVersion(),
    platform: getPlatform(),
    cwd,
    editor: getEditorEnv(),
    configFile,
    historyFile: pathExistsSync(historyFile) ? historyFile : undefined,
    snapshotDir: pathExistsSync(snapshotDir) ? snapshotDir : undefined,
  };
}

export function formatEnvInfo(info: EnvInfo): string {
  const lines: string[] = [
    `Node.js:     ${info.nodeVersion}`,
    `Platform:    ${info.platform}`,
    `CWD:         ${info.cwd}`,
    `Editor:      ${info.editor ?? '(not set)'}`,
    `Config:      ${info.configFile ?? '(none found)'}`,
    `History:     ${info.historyFile ?? '(none)'}`,
    `Snapshots:   ${info.snapshotDir ?? '(none)'}`,
  ];
  return lines.join('\n');
}
