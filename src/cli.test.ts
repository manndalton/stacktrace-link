import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { run, readStdin } from './cli';
import * as editorModule from './editor';

jest.mock('./editor', () => ({
  detectEditor: jest.fn(() => 'code'),
  openInEditor: jest.fn().mockResolvedValue(undefined),
  buildEditorCommand: jest.requireActual('./editor').buildEditorCommand,
}));

const SAMPLE_TRACE = `Error: something went wrong
    at Object.<anonymous> (/home/user/project/src/index.ts:10:5)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)`;

describe('run()', () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `trace-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, SAMPLE_TRACE, 'utf-8');
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it('opens the first user frame when given a file', async () => {
    await run({ file: tmpFile });
    expect(editorModule.openInEditor).toHaveBeenCalledTimes(1);
    const [frame] = (editorModule.openInEditor as jest.Mock).mock.calls[0];
    expect(frame.file).toContain('index.ts');
    expect(frame.line).toBe(10);
  });

  it('opens all frames when --all flag is set', async () => {
    await run({ file: tmpFile, all: true });
    expect(editorModule.openInEditor).toHaveBeenCalledTimes(1);
  });

  it('uses provided editor over detected one', async () => {
    await run({ file: tmpFile, editor: 'vim' });
    const [, editor] = (editorModule.openInEditor as jest.Mock).mock.calls[0];
    expect(editor).toBe('vim');
  });

  it('exits with error when file does not exist', async () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(run({ file: '/nonexistent/path.txt' })).rejects.toThrow('exit');
    expect(exit).toHaveBeenCalledWith(1);
    exit.mockRestore();
  });

  it('exits with error when no stack frames found', async () => {
    const emptyFile = path.join(os.tmpdir(), 'empty.txt');
    fs.writeFileSync(emptyFile, 'no stack trace here', 'utf-8');
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(run({ file: emptyFile })).rejects.toThrow('exit');
    expect(exit).toHaveBeenCalledWith(1);
    exit.mockRestore();
    fs.unlinkSync(emptyFile);
  });
});
