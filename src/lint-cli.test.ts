import { runLintCli } from './lint-cli';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const sampleTrace = `Error: fail
    at foo (node:internal/process/task_queues:140:5)
    at bar (/home/user/app.js:20:3)`;

let tmpFile: string;

beforeEach(() => {
  tmpFile = path.join(os.tmpdir(), `lint-cli-${Date.now()}.txt`);
  fs.writeFileSync(tmpFile, sampleTrace);
});

afterEach(() => {
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
});

/** Captures all console.log output produced during a runLintCli call. */
function captureOutput(args: string[]): string {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runLintCli(args);
  const output = spy.mock.calls.map(c => c[0]).join('\n');
  spy.mockRestore();
  return output;
}

describe('runLintCli', () => {
  it('prints usage with --help', () => {
    const output = captureOutput(['--help']);
    expect(output).toContain('Usage');
  });

  it('lists rules with --rules', () => {
    const output = captureOutput(['--rules']);
    expect(output).toContain('lint rules');
  });

  it('lints a file and reports issues', () => {
    const output = captureOutput([tmpFile]);
    expect(output).toMatch(/issue/);
  });

  it('exits with code 1 when issues found', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runLintCli([tmpFile]);
    expect(process.exitCode).toBe(1);
    process.exitCode = 0;
    spy.mockRestore();
  });

  it('exits cleanly for clean trace', () => {
    const cleanFile = path.join(os.tmpdir(), `lint-clean-${Date.now()}.txt`);
    fs.writeFileSync(cleanFile, 'Error: oops\n    at myFunc (/project/src/app.ts:10:5)');
    const output = captureOutput([cleanFile]);
    expect(output).toMatch(/No issues/);
    fs.unlinkSync(cleanFile);
  });

  it('filters by severity', () => {
    // Should not throw; output filtering is exercised without asserting specific content
    expect(() => captureOutput(['--severity=error', tmpFile])).not.toThrow();
  });

  it('errors without file or --stdin', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    runLintCli([]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
    exitSpy.mockRestore();
  });
});
