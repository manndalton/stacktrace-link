import { parseArgs, printUsage } from './export-cli';

test('parseArgs defaults', () => {
  const args = parseArgs([]);
  expect(args.format).toBe('json');
  expect(args.includeMetadata).toBe(false);
  expect(args.help).toBe(false);
  expect(args.outputPath).toBeUndefined();
  expect(args.inputPath).toBeUndefined();
});

test('parseArgs --format flag', () => {
  expect(parseArgs(['--format', 'csv']).format).toBe('csv');
  expect(parseArgs(['-f', 'markdown']).format).toBe('markdown');
});

test('parseArgs --output flag', () => {
  const args = parseArgs(['--output', '/tmp/out.json']);
  expect(args.outputPath).toBe('/tmp/out.json');
});

test('parseArgs -o shorthand', () => {
  const args = parseArgs(['-o', '/tmp/out.csv']);
  expect(args.outputPath).toBe('/tmp/out.csv');
});

test('parseArgs --input flag', () => {
  const args = parseArgs(['--input', '/tmp/trace.txt']);
  expect(args.inputPath).toBe('/tmp/trace.txt');
});

test('parseArgs -i shorthand', () => {
  const args = parseArgs(['-i', '/tmp/trace.txt']);
  expect(args.inputPath).toBe('/tmp/trace.txt');
});

test('parseArgs --metadata flag', () => {
  const args = parseArgs(['--metadata']);
  expect(args.includeMetadata).toBe(true);
});

test('parseArgs --help flag', () => {
  expect(parseArgs(['--help']).help).toBe(true);
  expect(parseArgs(['-h']).help).toBe(true);
});

test('parseArgs combined flags', () => {
  const args = parseArgs(['-f', 'markdown', '-o', 'out.md', '--metadata']);
  expect(args.format).toBe('markdown');
  expect(args.outputPath).toBe('out.md');
  expect(args.includeMetadata).toBe(true);
});

test('printUsage does not throw', () => {
  expect(() => printUsage()).not.toThrow();
});
