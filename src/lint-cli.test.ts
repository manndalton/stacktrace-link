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

describe('runLintCli', () => {
  it('prints usage with --help', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runLintCli(['--help']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Usage'));
    spy.mockRestore();
  });

  it('lists rules with --rules', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runLintCli(['--rules']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('lint rules'));
    spy.mockRestore();
  });

  it('lints a file and reports issues', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runLintCli([tmpFile]);
    const output = spy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toMatch(/issue/);
    spy.mockRestore();
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
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runLintCli([cleanFile]);
    const output = spy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toMatch(/No issues/);
    fs.unlinkSync(cleanFile);
    spy.mockRestore();
  });

  it('filters by severity', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runLintCli(['--severity=error', tmpFile]);
    spy.mockRestore();
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
