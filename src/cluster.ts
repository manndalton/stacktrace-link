import { StackFrame } from './parser';

export interface FrameCluster {
  id: string;
  label: string;
  frames: StackFrame[];
  centroid: string;
}

export function normalizeSignature(frame: StackFrame): string {
  return `${frame.file}:${frame.function ?? '<anonymous>'}`;
}

export function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

export function frameSimilarity(a: StackFrame, b: StackFrame): number {
  const sigA = normalizeSignature(a);
  const sigB = normalizeSignature(b);
  const maxLen = Math.max(sigA.length, sigB.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(sigA, sigB) / maxLen;
}

export function clusterFrames(
  frames: StackFrame[],
  threshold = 0.75
): FrameCluster[] {
  const clusters: FrameCluster[] = [];

  for (const frame of frames) {
    let bestCluster: FrameCluster | null = null;
    let bestScore = 0;

    for (const cluster of clusters) {
      const centroidFrame = cluster.frames[0];
      const score = frameSimilarity(frame, centroidFrame);
      if (score >= threshold && score > bestScore) {
        bestScore = score;
        bestCluster = cluster;
      }
    }

    if (bestCluster) {
      bestCluster.frames.push(frame);
    } else {
      const sig = normalizeSignature(frame);
      clusters.push({
        id: `cluster-${clusters.length + 1}`,
        label: sig,
        frames: [frame],
        centroid: sig,
      });
    }
  }

  return clusters;
}

export function formatClusterSummary(clusters: FrameCluster[]): string {
  return clusters
    .map(
      (c) =>
        `[${c.id}] ${c.label} — ${c.frames.length} frame${
          c.frames.length !== 1 ? 's' : ''
        }`
    )
    .join('\n');
}
