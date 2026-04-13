import { exportToJson, exportToCsv, exportToMarkdown, exportToText, exportFrames } from './export';
import { StackFrame } from './parser';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const frames: StackFrame[] = [
  { file: '/app/src/index.ts', line: 10, column: 5, fn: 'main' },
  { file: '/app/src/utils.ts', line: 42, column: 3, fn: 'helper' },
];

test('exportToJson returns valid JSON with frames array', () => {
  const result = exportToJson(frames);
  const parsed = JSON.parse(result);
  expect(Array.isArray(parsed)).toBe(true);
  expect(parsed).toHaveLength(2);
  expect(parsed[0].file).toBe('/app/src/index.ts');
});

test('exportToJson with metadata includes exportedAt and frameCount', () => {
  const result = exportToJson(frames, true);
  const parsed = JSON.parse(result);
  expect(parsed.frameCount).toBe(2);
  expect(parsed.exportedAt).toBeDefined();
  expect(Array.isArray(parsed.frames)).toBe(true);
});

test('exportToCsv returns header and rows', () => {
  const result = exportToCsv(frames);
  const lines = result.split('\n');
  expect(lines[0]).toBe('file,line,column,function');
  expect(lines).toHaveLength(3);
  expect(lines[1]).toContain('index.ts');
});

test('exportToMarkdown returns markdown table', () => {
  const result = exportToMarkdown(frames);
  expect(result).toContain('# Stack Trace');
  expect(result).toContain('| # | Function |');
  expect(result).toContain('main');
  expect(result).toContain('helper');
});

test('exportToText returns one line per frame', () => {
  const result = exportToText(frames);
  const lines = result.split('\n');
  expect(lines).toHaveLength(2);
});

test('exportFrames writes file when outputPath provided', () => {
  const tmpFile = path.join(os.tmpdir(), `export-test-${Date.now()}.json`);
  exportFrames(frames, { format: 'json', outputPath: tmpFile });
  expect(fs.existsSync(tmpFile)).toBe(true);
  const content = fs.readFileSync(tmpFile, 'utf8');
  expect(JSON.parse(content)).toHaveLength(2);
  fs.unlinkSync(tmpFile);
});

test('exportFrames returns frameCount', () => {
  const result = exportFrames(frames, { format: 'csv' });
  expect(result.frameCount).toBe(2);
  expect(result.format).toBe('csv');
});
