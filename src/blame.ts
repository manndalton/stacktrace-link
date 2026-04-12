import { execSync } from 'child_process';
import * as path from 'path';

export interface BlameInfo {
  file: string;
  line: number;
  commit: string;
  author: string;
  date: string;
  summary: string;
}

export function getBlameForLine(filePath: string, line: number): BlameInfo | null {
  try {
    const absPath = path.resolve(filePath);
    const output = execSync(
      `git blame -L ${line},${line} --porcelain "${absPath}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return parseBlameOutput(output, filePath, line);
  } catch {
    return null;
  }
}

export function parseBlameOutput(raw: string, file: string, line: number): BlameInfo | null {
  const lines = raw.split('\n');
  if (lines.length < 1) return null;

  const commitLine = lines[0].split(' ');
  const commit = commitLine[0] ?? 'unknown';

  const get = (prefix: string): string => {
    const found = lines.find(l => l.startsWith(prefix));
    return found ? found.slice(prefix.length).trim() : 'unknown';
  };

  return {
    file,
    line,
    commit: commit.slice(0, 8),
    author: get('author '),
    date: get('author-time '),
    summary: get('summary '),
  };
}

export function isGitRepo(dir: string = process.cwd()): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      cwd: dir,
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return true;
  } catch {
    return false;
  }
}
