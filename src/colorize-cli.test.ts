import { parseArgs, runColorizeCli, printUsage } from './colorize-cli';
import * as output from './output';

const SAMPLE_TRACE = `Error: something went wrong
    at doThing (/home/user/project/src/index.ts:10:5)
    at main (/home/user/project/src/main.ts:20:3)
    at Object.<anonymous> (/home/user/project/src/main.ts:25:1)`;

describe('parseArgs', () => {
  it('returns defaults when no args given', () => {
    const result = parseArgs([]);
    expect(result.noColor).toBe(false);
    expect(result.userOnly).toBe(false);
    expect(result.theme).toBeUndefined();
  });

  it('parses --no-color', () => {
    const result = parseArgs(['--no-color']);
    expect(result.noColor).toBe(true);
  });

  it('parses --user-only', () => {
    const result = parseArgs(['--user-only']);
    expect(result.userOnly).toBe(true);
  });

  it('parses --theme with value', () => {
    const result = parseArgs(['--theme', 'monokai']);
    expect(result.theme).toBe('monokai');
  });

  it('parses combined flags', () => {
    const result = parseArgs(['--no-color', '--user-only', '--theme', 'dark']);
    expect(result.noColor).toBe(true);
    expect(result.userOnly).toBe(true);
    expect(result.theme).toBe('dark');
  });
});

describe('printUsage', () => {
  it('prints usage without throwing', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => printUsage()).not.toThrow();
    spy.mockRestore();
  });
});

describe('runColorizeCli', () => {
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(output, 'printError').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('outputs lines for each frame with --no-color', async () => {
    await runColorizeCli(SAMPLE_TRACE, ['--no-color']);
    expect(logSpy.mock.calls.length).toBeGreaterThan(0);
    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    expect(output).toContain('index.ts');
    expect(output).toContain('main.ts');
  });

  it('exits with error on empty input', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    await runColorizeCli('no frames here', ['--no-color']);
    expect(errorSpy).toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});
