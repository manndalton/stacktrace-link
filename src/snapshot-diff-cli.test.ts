import { runSnapshotDiffCli } from './snapshot-diff-cli';
import * as snapshot from './snapshot';
import * as snapshotDiff from './snapshot-diff';
import * as output from './output';

jest.mock('./snapshot');
jest.mock('./snapshot-diff');
jest.mock('./output');

const mockLoadSnapshot = snapshot.loadSnapshot as jest.MockedFunction<typeof snapshot.loadSnapshot>;
const mockListSnapshots = snapshot.listSnapshots as jest.MockedFunction<typeof snapshot.listSnapshots>;
const mockDiffSnapshots = snapshotDiff.diffSnapshots as jest.MockedFunction<typeof snapshotDiff.diffSnapshots>;
const mockFormatDiff = snapshotDiff.formatDiff as jest.MockedFunction<typeof snapshotDiff.formatDiff>;
const mockPrintError = output.printError as jest.MockedFunction<typeof output.printError>;
const mockPrintInfo = output.printInfo as jest.MockedFunction<typeof output.printInfo>;

const snap1 = { id: 'abc', frames: [], createdAt: Date.now(), label: 'first' } as any;
const snap2 = { id: 'def', frames: [], createdAt: Date.now(), label: 'second' } as any;

beforeEach(() => jest.clearAllMocks());

describe('runSnapshotDiffCli', () => {
  it('prints usage when no args provided', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runSnapshotDiffCli(['node', 'snapshot-diff-cli']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
    spy.mockRestore();
  });

  it('prints usage with --help flag', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runSnapshotDiffCli(['node', 'snapshot-diff-cli', '--help']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
    spy.mockRestore();
  });

  it('lists snapshots with --list flag', async () => {
    mockListSnapshots.mockResolvedValue([snap1, snap2]);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runSnapshotDiffCli(['node', 'snapshot-diff-cli', '--list']);
    expect(mockListSnapshots).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('abc'));
    spy.mockRestore();
  });

  it('shows info message when no snapshots exist', async () => {
    mockListSnapshots.mockResolvedValue([]);
    await runSnapshotDiffCli(['node', 'snapshot-diff-cli', '--list']);
    expect(mockPrintInfo).toHaveBeenCalledWith('No snapshots found.');
  });

  it('diffs two snapshots by ID', async () => {
    mockLoadSnapshot.mockResolvedValueOnce(snap1).mockResolvedValueOnce(snap2);
    mockDiffSnapshots.mockReturnValue({ added: [], removed: [], unchanged: [] } as any);
    mockFormatDiff.mockReturnValue('diff output');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runSnapshotDiffCli(['node', 'snapshot-diff-cli', 'abc', 'def']);
    expect(mockDiffSnapshots).toHaveBeenCalledWith(snap1, snap2);
    expect(spy).toHaveBeenCalledWith('diff output');
    spy.mockRestore();
  });

  it('errors when first snapshot not found', async () => {
    mockLoadSnapshot.mockResolvedValue(null);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runSnapshotDiffCli(['node', 'snapshot-diff-cli', 'bad', 'def'])).rejects.toThrow('exit');
    expect(mockPrintError).toHaveBeenCalledWith(expect.stringContaining('bad'));
    exitSpy.mockRestore();
  });
});
