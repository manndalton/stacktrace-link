import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getMetricsPath,
  loadMetrics,
  saveMetrics,
  recordMetric,
  clearMetrics,
  summarizeMetrics,
  MetricsEntry,
} from './metrics';

const ORIG_HOME = process.env.HOME;
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'metrics-test-'));
  process.env.HOME = tmpDir;
});

afterEach(() => {
  process.env.HOME = ORIG_HOME;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const makeEntry = (overrides: Partial<MetricsEntry> = {}): MetricsEntry => ({
  timestamp: Date.now(),
  command: 'open',
  durationMs: 120,
  success: true,
  ...overrides,
});

test('loadMetrics returns empty array when no file exists', () => {
  expect(loadMetrics()).toEqual([]);
});

test('saveMetrics and loadMetrics round-trip', () => {
  const entries = [makeEntry(), makeEntry({ command: 'filter', success: false })];
  saveMetrics(entries);
  expect(loadMetrics()).toEqual(entries);
});

test('recordMetric appends an entry', () => {
  recordMetric(makeEntry({ command: 'open' }));
  recordMetric(makeEntry({ command: 'lint' }));
  const entries = loadMetrics();
  expect(entries).toHaveLength(2);
  expect(entries[1].command).toBe('lint');
});

test('recordMetric caps at 500 entries', () => {
  const entries = Array.from({ length: 502 }, (_, i) => makeEntry({ durationMs: i }));
  saveMetrics(entries);
  recordMetric(makeEntry());
  expect(loadMetrics()).toHaveLength(500);
});

test('clearMetrics empties the list', () => {
  recordMetric(makeEntry());
  clearMetrics();
  expect(loadMetrics()).toEqual([]);
});

test('summarizeMetrics handles empty array', () => {
  const s = summarizeMetrics([]);
  expect(s.totalRuns).toBe(0);
  expect(s.successRate).toBe(0);
});

test('summarizeMetrics computes correct values', () => {
  const entries = [
    makeEntry({ command: 'open', durationMs: 100, success: true }),
    makeEntry({ command: 'open', durationMs: 200, success: true }),
    makeEntry({ command: 'lint', durationMs: 300, success: false }),
  ];
  const s = summarizeMetrics(entries);
  expect(s.totalRuns).toBe(3);
  expect(s.successRate).toBeCloseTo(2 / 3);
  expect(s.avgDurationMs).toBeCloseTo(200);
  expect(s.commandCounts).toEqual({ open: 2, lint: 1 });
});
