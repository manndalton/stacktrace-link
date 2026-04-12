import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { saveShare } from './share';
import { runList, runShow, runExport, runDelete } from './share-cli';
import { StackFrame } from './parser';

const frames: StackFrame[] = [
  { file: '/app/index.ts', line: 1, column: 1, fn: 'fn', raw: 'at fn (/app/index.ts:1:1)' },
];
const rawTrace = 'Error: test\n    at fn (/app/index.ts:1:1)';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'share-cli-test-'));
  jest.spyOn(os, 'homedir').mockReturnValue(tmpDir);
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('runList prints info when no shares', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runList();
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('No shares'));
  spy.mockRestore();
});

test('runList prints share entries', () => {
  const payload = saveShare(frames, rawTrace, 'hello');
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runList();
  const output = spy.mock.calls.map(c => c[0]).join('\n');
  expect(output).toContain(payload.id);
  spy.mockRestore();
});

test('runShow prints JSON for valid id', () => {
  const payload = saveShare(frames, rawTrace);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runShow(payload.id);
  const output = spy.mock.calls.map(c => c[0]).join('');
  expect(output).toContain(payload.id);
  spy.mockRestore();
});

test('runShow exits on unknown id', () => {
  const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  expect(() => runShow('nope')).toThrow('exit');
  exit.mockRestore();
});

test('runExport outputs plain text', () => {
  const payload = saveShare(frames, rawTrace, 'export');
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runExport(payload.id);
  const output = spy.mock.calls.map(c => c[0]).join('');
  expect(output).toContain(payload.id);
  expect(output).toContain(rawTrace);
  spy.mockRestore();
});

test('runDelete removes share', () => {
  const payload = saveShare(frames, rawTrace);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runDelete(payload.id);
  const output = spy.mock.calls.map(c => c[0]).join('');
  expect(output).toContain(payload.id);
  spy.mockRestore();
});

test('runDelete exits on unknown id', () => {
  const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  expect(() => runDelete('ghost')).toThrow('exit');
  exit.mockRestore();
});
