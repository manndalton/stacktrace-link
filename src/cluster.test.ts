import { clusterFrames, frameSimilarity, formatClusterSummary, levenshtein, normalizeSignature } from './cluster';
import { StackFrame } from './parser';

function makeFrame(file: string, fn?: string, line = 1): StackFrame {
  return { file, function: fn, line, column: 0, raw: '' };
}

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('abc', 'abc')).toBe(0);
  });

  it('returns correct distance for different strings', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
  });

  it('handles empty strings', () => {
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abc', '')).toBe(3);
  });
});

describe('normalizeSignature', () => {
  it('combines file and function name', () => {
    const frame = makeFrame('/src/foo.ts', 'bar');
    expect(normalizeSignature(frame)).toBe('/src/foo.ts:bar');
  });

  it('uses anonymous when function is missing', () => {
    const frame = makeFrame('/src/foo.ts');
    expect(normalizeSignature(frame)).toBe('/src/foo.ts:<anonymous>');
  });
});

describe('frameSimilarity', () => {
  it('returns 1 for identical frames', () => {
    const f = makeFrame('/src/app.ts', 'run');
    expect(frameSimilarity(f, f)).toBe(1);
  });

  it('returns value between 0 and 1 for similar frames', () => {
    const a = makeFrame('/src/app.ts', 'handleRequest');
    const b = makeFrame('/src/app.ts', 'handleResponse');
    const score = frameSimilarity(a, b);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });
});

describe('clusterFrames', () => {
  it('groups identical frames together', () => {
    const frames = [
      makeFrame('/src/app.ts', 'run'),
      makeFrame('/src/app.ts', 'run'),
      makeFrame('/src/other.ts', 'start'),
    ];
    const clusters = clusterFrames(frames, 0.9);
    expect(clusters).toHaveLength(2);
    expect(clusters[0].frames).toHaveLength(2);
    expect(clusters[1].frames).toHaveLength(1);
  });

  it('creates separate clusters for dissimilar frames', () => {
    const frames = [
      makeFrame('/src/a.ts', 'alpha'),
      makeFrame('/src/z.ts', 'omega'),
    ];
    const clusters = clusterFrames(frames, 0.99);
    expect(clusters).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(clusterFrames([])).toEqual([]);
  });
});

describe('formatClusterSummary', () => {
  it('formats clusters with frame counts', () => {
    const frames = [makeFrame('/src/app.ts', 'run'), makeFrame('/src/app.ts', 'run')];
    const clusters = clusterFrames(frames, 0.9);
    const summary = formatClusterSummary(clusters);
    expect(summary).toContain('2 frames');
    expect(summary).toContain('cluster-1');
  });

  it('uses singular for single frame', () => {
    const clusters = clusterFrames([makeFrame('/src/x.ts', 'go')], 0.9);
    expect(formatClusterSummary(clusters)).toContain('1 frame');
  });
});
