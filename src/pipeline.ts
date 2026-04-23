/**
 * pipeline.ts
 *
 * Composable processing pipeline for stack trace frames.
 * Allows chaining of transforms, filters, and formatters into
 * a single reusable pipeline definition.
 */

import type { StackFrame } from './parser';

export type PipelineStep<T = StackFrame[]> = (input: T) => T;

export interface Pipeline {
  name: string;
  steps: PipelineStep[];
  description?: string;
}

export interface PipelineResult {
  pipeline: string;
  inputCount: number;
  outputCount: number;
  frames: StackFrame[];
  durationMs: number;
}

/**
 * Build a pipeline from an ordered list of steps.
 */
export function buildPipeline(
  name: string,
  steps: PipelineStep[],
  description?: string
): Pipeline {
  return { name, steps, description };
}

/**
 * Run frames through each step of the pipeline in order.
 */
export function runPipeline(
  pipeline: Pipeline,
  frames: StackFrame[]
): PipelineResult {
  const start = Date.now();
  const inputCount = frames.length;

  let current = frames;
  for (const step of pipeline.steps) {
    current = step(current);
  }

  return {
    pipeline: pipeline.name,
    inputCount,
    outputCount: current.length,
    frames: current,
    durationMs: Date.now() - start,
  };
}

/**
 * Compose two pipelines into one, running left then right.
 */
export function composePipelines(a: Pipeline, b: Pipeline): Pipeline {
  return buildPipeline(
    `${a.name}|${b.name}`,
    [...a.steps, ...b.steps],
    `${a.description ?? a.name} then ${b.description ?? b.name}`
  );
}

/**
 * Create a step that applies a per-frame transform and filters out nulls.
 */
export function makeMapStep(
  fn: (frame: StackFrame) => StackFrame | null
): PipelineStep {
  return (frames) =>
    frames.reduce<StackFrame[]>((acc, f) => {
      const result = fn(f);
      if (result !== null) acc.push(result);
      return acc;
    }, []);
}

/**
 * Create a step that filters frames by a predicate.
 */
export function makeFilterStep(
  predicate: (frame: StackFrame) => boolean
): PipelineStep {
  return (frames) => frames.filter(predicate);
}

/**
 * Create a step that limits the number of frames.
 */
export function makeLimitStep(max: number): PipelineStep {
  return (frames) => frames.slice(0, max);
}

/**
 * Format a pipeline result as a human-readable summary line.
 */
export function formatPipelineResult(result: PipelineResult): string {
  const dropped = result.inputCount - result.outputCount;
  const dropNote = dropped > 0 ? `, dropped ${dropped}` : '';
  return (
    `[${result.pipeline}] ${result.outputCount} frame(s)` +
    `${dropNote} in ${result.durationMs}ms`
  );
}
