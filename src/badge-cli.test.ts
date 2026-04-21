import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runBadgeCli } from './badge-cli';
import { loadBadges, addBadge } from './badge';

function makeTempStore(tmp: string) {
  jest.spyOn(os, 'homedir').mockReturnValue(tmp);
}

describe('badge-cli', () => {
  let tmp: string;
  let logSpy: jest.SpyInstance;
  let errSpy: jest.SpyInstance;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'badge-cli-test-'));
    makeTempStore(tmp);
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  test('list prints no badges message when empty', () => {
    runBadgeCli(['list']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No badges'));
  });

  test('add creates a badge', () => {
    runBadgeCli(['add', 'passing', '#4c1']);
    expect(loadBadges()).toHaveLength(1);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Badge added'));
  });

  test('list shows added badge', () => {
    runBadgeCli(['add', 'warn', 'orange']);
    runBadgeCli(['list']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('warn'));
  });

  test('show prints badge JSON', () => {
    const b = addBadge('info', 'blue');
    runBadgeCli(['show', b.id]);
    const output = logSpy.mock.calls.map((c: string[]) => c[0]).join('');
    expect(output).toContain('info');
  });

  test('svg prints SVG for badge', () => {
    const b = addBadge('build', '#0a0');
    runBadgeCli(['svg', b.id]);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('<svg'));
  });

  test('remove deletes badge', () => {
    const b = addBadge('del', 'red');
    runBadgeCli(['remove', b.id]);
    expect(loadBadges()).toHaveLength(0);
  });

  test('remove unknown id exits with error', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runBadgeCli(['remove', 'nope'])).toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('unknown command prints usage', () => {
    runBadgeCli(['unknown']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Usage'));
  });
});
