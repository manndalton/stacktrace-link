import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { saveTimings } from './timings';
import { runTimingsCli } from './timings-cli';

const ORIG_HOME = process.env.HOME;
let logs: string[];

beforeEach(() => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'timings-cli-test-'));
  process.env.HOME = tmp;
  logs = [];
  jest.spyOn(console, 'log').mockImplementation((...args) => logs.push(args.join(' ')));
});

afterEach(() => {
  process.env.HOME = ORIG_HOME;
  jest.restoreAllMocks();
});

test('list with no entries', () => {
  runTimingsCli(['list']);
  expect(logs[0]).toMatch(/No timing/);
});

test('list shows entries', () => {
  saveTimings([{ id: 'x1', label: 'run', startedAt: 0, duration: 55, frameCount: 2 }]);
  runTimingsCli(['list']);
  expect(logs[0]).toContain('run');
  expect(logs[0]).toContain('55ms');
});

test('stats shows metrics', () => {
  saveTimings([
    { id: 'a', label: 'a', startedAt: 0, duration: 20, frameCount: 1 },
    { id: 'b', label: 'b', startedAt: 0, duration: 40, frameCount: 2 },
  ]);
  runTimingsCli(['stats']);
  expect(logs.join('\n')).toContain('30.00ms');
  expect(logs.join('\n')).toContain('Min   : 20ms');
});

test('clear removes entries', () => {
  saveTimings([{ id: 'z', label: 'z', startedAt: 0, duration: 1, frameCount: 1 }]);
  runTimingsCli(['clear']);
  expect(logs[0]).toMatch(/cleared/);
  runTimingsCli(['list']);
  expect(logs[1]).toMatch(/No timing/);
});

test('unknown command prints usage', () => {
  runTimingsCli(['unknown']);
  expect(logs[0]).toMatch(/Usage/);
});
