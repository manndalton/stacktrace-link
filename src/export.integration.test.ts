import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { exportFrames } from './export';
import { parseStackTrace } from './parser';

const SAMPLE_TRACE = `Error: something went wrong
    at Object.main (/app/src/index.ts:10:5)
    at helper (/app/src/utils.ts:42:3)
    at /app/src/runner.ts:7:1`;

function tmpPath(ext: string): string {
  return path.join(os.tmpdir(), `export-integration-${Date.now()}.${ext}`);
}

test('full pipeline: parse then export to json file', () => {
  const frames = parseStackTrace(SAMPLE_TRACE);
  expect(frames.length).toBeGreaterThan(0);
  const out = tmpPath('json');
  const result = exportFrames(frames, { format: 'json', outputPath: out });
  expect(fs.existsSync(out)).toBe(true);
  const parsed = JSON.parse(fs.readFileSync(out, 'utf8'));
  expect(parsed).toHaveLength(result.frameCount);
  fs.unlinkSync(out);
});

test('full pipeline: parse then export to csv file', () => {
  const frames = parseStackTrace(SAMPLE_TRACE);
  const out = tmpPath('csv');
  exportFrames(frames, { format: 'csv', outputPath: out });
  const lines = fs.readFileSync(out, 'utf8').split('\n');
  expect(lines[0]).toBe('file,line,column,function');
  expect(lines.length).toBe(frames.length + 1);
  fs.unlinkSync(out);
});

test('full pipeline: parse then export to markdown', () => {
  const frames = parseStackTrace(SAMPLE_TRACE);
  const result = exportFrames(frames, { format: 'markdown' });
  expect(result.content).toContain('# Stack Trace');
  expect(result.content).toContain('index.ts');
});

test('json export with metadata round-trips correctly', () => {
  const frames = parseStackTrace(SAMPLE_TRACE);
  const result = exportFrames(frames, { format: 'json', includeMetadata: true });
  const parsed = JSON.parse(result.content);
  expect(parsed.frameCount).toBe(frames.length);
  expect(new Date(parsed.exportedAt).getFullYear()).toBeGreaterThan(2020);
});
