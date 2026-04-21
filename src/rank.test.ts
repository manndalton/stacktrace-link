import { rankFrames, topRankedFrame, scoreFrame, formatRankedFrame } from './rank';
import { StackFrame } from './parser';
import * as metrics from './metrics';

function makeFrame(file: string, line: number): StackFrame {
  return { file, line, column: 1, fn: 'fn', raw: '' };
}

const mockMetrics = [
  { file: 'src/app.ts', line: 10, timestamp: Date.now() },
  { file: 'src/app.ts', line: 10, timestamp: Date.now() },
  { file: 'src/util.ts', line: 5, timestamp: Date.now() },
];

beforeEach(() => {
  jest.spyOn(metrics, 'loadMetrics').mockReturnValue(mockMetrics as any);
});

afterEach(() => jest.restoreAllMocks());

test('rankFrames sorts by hit count descending', () => {
  const frames = [makeFrame('src/util.ts', 5), makeFrame('src/app.ts', 10)];
  const ranked = rankFrames(frames);
  expect(ranked[0].file).toBe('src/app.ts');
  expect(ranked[0].hitCount).toBe(2);
  expect(ranked[1].hitCount).toBe(1);
});

test('rankFrames assigns zero score to unseen frames', () => {
  const frames = [makeFrame('src/new.ts', 99)];
  const ranked = rankFrames(frames);
  expect(ranked[0].hitCount).toBe(0);
  expect(ranked[0].score).toBe(0);
});

test('topRankedFrame returns highest scoring frame', () => {
  const frames = [makeFrame('src/util.ts', 5), makeFrame('src/app.ts', 10)];
  const top = topRankedFrame(frames);
  expect(top?.file).toBe('src/app.ts');
});

test('topRankedFrame returns undefined for empty input', () => {
  expect(topRankedFrame([])).toBeUndefined();
});

test('scoreFrame uses hitCounts map correctly', () => {
  const frame = makeFrame('src/app.ts', 10);
  const score = scoreFrame(frame, { 'src/app.ts:10': 7 });
  expect(score).toBe(7);
});

test('formatRankedFrame includes hit count and location', () => {
  const frame = { ...makeFrame('src/app.ts', 10), score: 2, hitCount: 2 };
  const result = formatRankedFrame(frame);
  expect(result).toContain('[2 hits]');
  expect(result).toContain('src/app.ts:10');
});
