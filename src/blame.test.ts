import { parseBlameOutput, getBlameForLine, isGitRepo } from './blame';
import { execSync } from 'child_process';

jest.mock('child_process');
const mockExec = execSync as jest.MockedFunction<typeof execSync>;

const SAMPLE_BLAME = [
  'abc1234def5678901234567890123456789012345 1 1 1',
  'author Jane Doe',
  'author-mail <jane@example.com>',
  'author-time 1700000000',
  'author-tz +0000',
  'committer Jane Doe',
  'summary fix: correct off-by-one error',
  '\t const x = 1;',
].join('\n');

describe('parseBlameOutput', () => {
  it('parses author and summary', () => {
    const result = parseBlameOutput(SAMPLE_BLAME, 'src/foo.ts', 1);
    expect(result).not.toBeNull();
    expect(result!.author).toBe('Jane Doe');
    expect(result!.summary).toBe('fix: correct off-by-one error');
    expect(result!.commit).toBe('abc1234d');
  });

  it('returns null for empty input', () => {
    const result = parseBlameOutput('', 'src/foo.ts', 1);
    expect(result).toBeNull();
  });

  it('sets file and line correctly', () => {
    const result = parseBlameOutput(SAMPLE_BLAME, 'src/bar.ts', 42);
    expect(result!.file).toBe('src/bar.ts');
    expect(result!.line).toBe(42);
  });
});

describe('getBlameForLine', () => {
  it('returns blame info on success', () => {
    mockExec.mockReturnValueOnce(SAMPLE_BLAME as any);
    const result = getBlameForLine('src/foo.ts', 1);
    expect(result).not.toBeNull();
    expect(result!.author).toBe('Jane Doe');
  });

  it('returns null when git fails', () => {
    mockExec.mockImplementationOnce(() => { throw new Error('not a repo'); });
    const result = getBlameForLine('src/foo.ts', 1);
    expect(result).toBeNull();
  });
});

describe('isGitRepo', () => {
  it('returns true when inside a git repo', () => {
    mockExec.mockReturnValueOnce('true\n' as any);
    expect(isGitRepo('/some/path')).toBe(true);
  });

  it('returns false when not a git repo', () => {
    mockExec.mockImplementationOnce(() => { throw new Error(); });
    expect(isGitRepo('/tmp')).toBe(false);
  });
});
