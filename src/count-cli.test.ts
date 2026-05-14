import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runCountCli } from './count-cli';

const SAMPLE_TRACE = `Error: something went wrong
    at Object.<anonymous> (/project/src/app.ts:10:5)
    at Module._compile (node:internal/modules/cjs/loader:1356:14)
    at /project/node_modules/ts-node/src/index.ts:857:23
`;

function makeTempFile(content: string): string {
  const file = path.join(os.tmpdir(), `count-cli-test-${Date.now()}.txt`);
  fs.writeFileSync(file, content);
  return file;
}

describe('runCountCli', () => {
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prints usage with --help', async () => {
    await runCountCli(['node', 'count-cli', '--help']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Usage'));
  });

  it('outputs text summary for a file', async () => {
    const file = makeTempFile(SAMPLE_TRACE);
    await runCountCli(['node', 'count-cli', file]);
    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Total frames');
    fs.unlinkSync(file);
  });

  it('outputs JSON with --json flag', async () => {
    const file = makeTempFile(SAMPLE_TRACE);
    await runCountCli(['node', 'count-cli', '--json', file]);
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('total');
    expect(parsed).toHaveProperty('userFrames');
    expect(parsed).toHaveProperty('nodeModules');
    fs.unlinkSync(file);
  });

  it('prints error and exits for missing file', async () => {
    await runCountCli(['node', 'count-cli', '/no/such/file.txt']);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('file not found'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
