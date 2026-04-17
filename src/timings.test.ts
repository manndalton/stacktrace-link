import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getTimingsPath,
  loadTimings,
  saveTimings,
  recordTiming,
  clearTimings,
  computeAverageDuration,
} from './timings';

const ORIG_HOME = process.env.HOME;

beforeEach(() => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'timings-test-'));
  process.env.HOME = tmp;
});

afterEach(() => {
  process.env.HOME = ORIG_HOME;
});

test('loadTimings returns [] when file missing', () => {
  expect(loadTimings()).toEqual([]);
});

test('saveTimings and loadTimings round-trip', () => {
  const entry = { id: 'a1', label: 'test', startedAt: 1, duration: 42, frameCount: 3 };
  saveTimings([entry]);
  expect(loadTimings()).toEqual([entry]);
});

test('recordTiming appends entry', () => {
  const e = recordTiming('parse', 100, 5);
  expect(e.label).toBe('parse');
  expect(e.duration).toBe(100);
  expect(e.frameCount).toBe(5);
  expect(loadTimings()).toHaveLength(1);
});

test('clearTimings empties list', () => {
  recordTiming('x', 10, 1);
  clearTimings();
  expect(loadTimings()).toEqual([]);
});

test('computeAverageDuration returns 0 for empty', () => {
  expect(computeAverageDuration([])).toBe(0);
});

test('computeAverageDuration averages durations', () => {
  const entries = [
    { id: '1', label: 'a', startedAt: 0, duration: 10, frameCount: 1 },
    { id: '2', label: 'b', startedAt: 0, duration: 30, frameCount: 2 },
  ];
  expect(computeAverageDuration(entries)).toBe(20);
});
