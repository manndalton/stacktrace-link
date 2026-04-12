import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * Integration tests that spin up a real temporary git repo
 * and verify end-to-end blame resolution.
 */

let tmpDir: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blame-test-'));
  execSync('git init', { cwd: tmpDir });
  execSync('git config user.email "test@test.com"', { cwd: tmpDir });
  execSync('git config user.name "Tester"', { cwd: tmpDir });
  fs.writeFileSync(path.join(tmpDir, 'foo.ts'), 'const x = 1;\nconst y = 2;\n');
  execSync('git add .', { cwd: tmpDir });
  execSync('git commit -m "initial commit"', { cwd: tmpDir });
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

import { getBlameForLine, isGitRepo } from './blame';

describe('blame integration', () => {
  it('detects the temp dir as a git repo', () => {
    expect(isGitRepo(tmpDir)).toBe(true);
  });

  it('returns blame info for a committed file', () => {
    const result = getBlameForLine(path.join(tmpDir, 'foo.ts'), 1);
    expect(result).not.toBeNull();
    expect(result!.author).toBe('Tester');
    expect(result!.summary).toBe('initial commit');
    expect(result!.commit).toHaveLength(8);
  });

  it('returns null for a non-existent file', () => {
    const result = getBlameForLine(path.join(tmpDir, 'missing.ts'), 1);
    expect(result).toBeNull();
  });

  it('returns null for a line out of range', () => {
    const result = getBlameForLine(path.join(tmpDir, 'foo.ts'), 9999);
    expect(result).toBeNull();
  });
});
