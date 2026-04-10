import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { runSnapshotCli } from './snapshot-cli';
import { saveSnapshot, generateId, Snapshot } from './snapshot';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-cli-test-'));

beforeEach(() => {
  process.env.XDG_DATA_HOME = tmpDir;
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const makeSnap = (label?: string): Snapshot => ({
  id: generateId(),
  timestamp: Date.now(),
  label,
  frames: [{ file: '/app/x.ts', line: 1, column: 1, fn: 'foo', raw: '' }],
  raw: 'Error\n  at foo (/app/x.ts:1:1)',
});

test('list prints "No snapshots" when empty', () => {
  // Use a fresh dir with no snapshots
  const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-empty-'));
  process.env.XDG_DATA_HOME = emptyDir;
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runSnapshotCli(['list']);
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('No snapshots'));
  spy.mockRestore();
  fs.rmSync(emptyDir, { recursive: true, force: true });
});

test('list shows saved snapshots', () => {
  const snap = makeSnap('test-label');
  saveSnapshot(snap);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runSnapshotCli(['list']);
  const output = spy.mock.calls.map(c => c[0]).join('\n');
  expect(output).toContain(snap.id);
  expect(output).toContain('test-label');
  spy.mockRestore();
});

test('show prints frames for a valid snapshot', () => {
  const snap = makeSnap('show-test');
  saveSnapshot(snap);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runSnapshotCli(['show', snap.id]);
  const output = spy.mock.calls.map(c => c[0]).join('\n');
  expect(output).toContain('/app/x.ts');
  spy.mockRestore();
});

test('show exits 1 for unknown id', () => {
  const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  expect(() => runSnapshotCli(['show', 'bad-id'])).toThrow('exit');
  exit.mockRestore();
});

test('delete removes a snapshot', () => {
  const snap = makeSnap();
  saveSnapshot(snap);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runSnapshotCli(['delete', snap.id]);
  const output = spy.mock.calls.map(c => c[0]).join('\n');
  expect(output).toContain('Deleted');
  spy.mockRestore();
});

test('help prints usage', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runSnapshotCli(['help']);
  const output = spy.mock.calls.map(c => c[0]).join('\n');
  expect(output).toContain('Usage');
  spy.mockRestore();
});
