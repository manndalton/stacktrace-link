import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface StacktraceLinkConfig {
  editor: string;
  projectRoot: string;
  showAllFrames: boolean;
}

const DEFAULT_CONFIG: StacktraceLinkConfig = {
  editor: process.env.EDITOR || process.env.VISUAL || 'code',
  projectRoot: process.cwd(),
  showAllFrames: false,
};

const CONFIG_FILE_NAMES = ['.stacktrace-link.json', '.stacktrace-linkrc'];

/**
 * Searches for a config file starting from the given directory up to the root.
 */
export function findConfigFile(startDir: string = process.cwd()): string | null {
  let dir = startDir;
  while (true) {
    for (const name of CONFIG_FILE_NAMES) {
      const candidate = path.join(dir, name);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 * Loads and merges config from file (if found) with defaults.
 */
export function loadConfig(startDir?: string): StacktraceLinkConfig {
  const configPath = findConfigFile(startDir);
  if (!configPath) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StacktraceLinkConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
