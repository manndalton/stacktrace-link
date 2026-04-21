import { runRankCli } from './rank-cli';
import * as rank from './rank';
import * as fs from 'fs';
import { StackFrame } from './parser';

function makeRanked(file: string, line: number, hitCount: number) {
  return { file, line, column: 1, fn: 'fn', raw: '', score: hitCount, hitCount };
}

const sampleTrace = [
  'Error: boom',
  '    at doThing (src/app.ts:10:5)',
  '    at main (src/index.ts:3:1)',
].join('\n');

beforeEach(() => {
  jest.spyOn(fs, 'readFileSync').mockReturnValue(sampleTrace as any);
  jest.spyOn(rank, 'rankFrames').mockReturnValue([
    makeRanked('src/app.ts', 10, 5),
    makeRanked('src/index.ts', 3, 1),
  ]);
  jest.spyOn(rank, 'topRankedFrame').mockReturnValue(makeRanked('src/app.ts', 10, 5));
});

afterEach(() => jest.restoreAllMocks());

test('prints ranked list by default', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runRankCli(['-']);
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('src/app.ts:10'));
  spy.mockRestore();
});

test('--top prints only single frame', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runRankCli(['--top', '-']);
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('[5 hits]'));
  spy.mockRestore();
});

test('--limit restricts output count', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runRankCli(['--limit', '1', '-']);
  expect(spy).toHaveBeenCalledTimes(1);
  spy.mockRestore();
});

test('exits with error on unreadable file', () => {
  (fs.readFileSync as jest.Mock).mockImplementation(() => { throw new Error('ENOENT'); });
  const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  expect(() => runRankCli(['missing.txt'])).toThrow('exit');
  expect(exitSpy).toHaveBeenCalledWith(1);
  exitSpy.mockRestore();
});
