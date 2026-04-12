import { formatBlame, runBlameCli, printUsage } from './blame-cli';
import * as blame from './blame';
import * as parser from './parser';
import * as resolver from './resolver';

jest.mock('./blame');
jest.mock('./parser');
jest.mock('./resolver');

const mockIsGitRepo = blame.isGitRepo as jest.Mock;
const mockGetBlame = blame.getBlameForLine as jest.Mock;
const mockParse = parser.parseStackTrace as jest.Mock;
const mockResolve = resolver.resolveUserFrames as jest.Mock;

const SAMPLE_BLAME = {
  file: 'src/foo.ts',
  line: 10,
  commit: 'abc12345',
  author: 'Alice',
  date: '1700000000',
  summary: 'feat: add feature',
};

const SAMPLE_FRAME = { file: 'src/foo.ts', line: 10, column: 1, fn: 'doThing' };

describe('formatBlame', () => {
  it('includes commit, author and summary', () => {
    const out = formatBlame(SAMPLE_BLAME);
    expect(out).toContain('abc12345');
    expect(out).toContain('Alice');
    expect(out).toContain('feat: add feature');
  });

  it('formats date as ISO date string', () => {
    const out = formatBlame(SAMPLE_BLAME);
    expect(out).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

describe('runBlameCli', () => {
  beforeEach(() => {
    mockIsGitRepo.mockReturnValue(true);
    mockParse.mockReturnValue([SAMPLE_FRAME]);
    mockResolve.mockReturnValue([SAMPLE_FRAME]);
    mockGetBlame.mockReturnValue(SAMPLE_BLAME);
  });

  it('prints usage with --help', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runBlameCli(['--help'], '');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Usage'));
    spy.mockRestore();
  });

  it('exits when not in a git repo', async () => {
    mockIsGitRepo.mockReturnValue(false);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runBlameCli([], 'Error\n  at foo (src/foo.ts:10:1)')).rejects.toThrow('exit');
    exitSpy.mockRestore();
  });

  it('prints blame for first user frame', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runBlameCli([], 'Error\n  at foo (src/foo.ts:10:1)');
    expect(mockGetBlame).toHaveBeenCalledWith('src/foo.ts', 10);
    spy.mockRestore();
  });

  it('prints blame for all frames with --all', async () => {
    const frame2 = { ...SAMPLE_FRAME, file: 'src/bar.ts', line: 20 };
    mockResolve.mockReturnValue([SAMPLE_FRAME, frame2]);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runBlameCli(['--all'], '');
    expect(mockGetBlame).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});
