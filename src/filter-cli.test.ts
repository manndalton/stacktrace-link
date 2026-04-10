import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runFilterCli } from './filter-cli.js';

describe('runFilterCli', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints usage when no command given', () => {
    runFilterCli([]);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
  });

  it('prints usage for help command', () => {
    runFilterCli(['help']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
  });

  it('test command shows INCLUDED for user file', () => {
    runFilterCli(['test', '/project/src/app.ts']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('INCLUDED'));
  });

  it('test command shows EXCLUDED for node_modules', () => {
    runFilterCli(['test', '/project/node_modules/lib.js']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('EXCLUDED'));
  });

  it('test command respects --include flag', () => {
    runFilterCli(['test', '/project/lib/util.ts', '--include', 'src']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('EXCLUDED'));
  });

  it('test command respects --exclude flag', () => {
    runFilterCli(['test', '/project/vendor/lib.js', '--exclude', 'vendor']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('EXCLUDED'));
  });

  it('test command errors without path', () => {
    runFilterCli(['test']);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('path argument required'));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('preview command outputs sample paths', () => {
    runFilterCli(['preview']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('src/app.ts'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('node_modules'));
  });

  it('unknown command exits with error', () => {
    runFilterCli(['unknown']);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown command'));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
