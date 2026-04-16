import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runPinCli } from './pin-cli';

const ORIG_HOME = process.env.HOME;
let tmpDir: string;
let output: string[];

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pin-cli-test-'));
  process.env.HOME = tmpDir;
  output = [];
  jest.spyOn(console, 'log').mockImplementation((...args) => output.push(args.join(' ')));
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  process.env.HOME = ORIG_HOME;
  fs.rmSync(tmpDir, { recursive: true, force: true });
  jest.restoreAllMocks();
});

test('list shows empty message', () => {
  runPinCli(['list']);
  expect(output[0]).toMatch(/No pins/);
});

test('add then list shows pin', () => {
  runPinCli(['add', 'bug', '/src/app.ts', '42']);
  expect(output[0]).toMatch(/Pinned/);
  output = [];
  runPinCli(['list']);
  expect(output[0]).toMatch(/bug/);
  expect(output[0]).toMatch(/42/);
});

test('remove existing pin', () => {
  runPinCli(['add', 'x', '/a.ts', '1']);
  const match = output[0].match(/\[([^\]]+)\]/);
  const id = match![1];
  output = [];
  runPinCli(['remove', id]);
  expect(output[0]).toMatch(/Removed/);
});

test('remove unknown pin', () => {
  runPinCli(['remove', 'bad-id']);
  expect(output[0]).toMatch(/not found/);
});

test('show pin details', () => {
  runPinCli(['add', 'detail', '/b.ts', '7', '3']);
  const match = output[0].match(/\[([^\]]+)\]/);
  const id = match![1];
  output = [];
  runPinCli(['show', id]);
  expect(output.join('')).toMatch(/detail/);
});

test('clear removes all pins', () => {
  runPinCli(['add', 'a', '/a.ts', '1']);
  runPinCli(['add', 'b', '/b.ts', '2']);
  output = [];
  runPinCli(['clear']);
  expect(output[0]).toMatch(/cleared/);
  output = [];
  runPinCli(['list']);
  expect(output[0]).toMatch(/No pins/);
});
