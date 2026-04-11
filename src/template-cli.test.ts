import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runTemplateCli } from './template-cli';

let tmpDir: string;
let logSpy: jest.SpyInstance;
let errSpy: jest.SpyInstance;
let exitSpy: jest.SpyInstance;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stl-tmplcli-'));
  jest.spyOn(os, 'homedir').mockReturnValue(tmpDir);
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit'); }) as any);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  jest.restoreAllMocks();
});

test('list prints no templates message when empty', () => {
  runTemplateCli(['list']);
  expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No templates'));
});

test('add then list shows the template', () => {
  runTemplateCli(['add', 'idea', 'idea://{file}:{line}', 'IntelliJ IDEA']);
  expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Template 'idea' saved"));
  logSpy.mockClear();
  runTemplateCli(['list']);
  expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('idea'));
});

test('add without pattern exits with error', () => {
  expect(() => runTemplateCli(['add', 'nopattern'])).toThrow('exit');
  expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('required'));
});

test('remove deletes a template', () => {
  runTemplateCli(['add', 'vim', 'vim +{line} {file}', 'Vim']);
  logSpy.mockClear();
  runTemplateCli(['remove', 'vim']);
  expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("'vim' removed"));
});

test('remove unknown template exits with error', () => {
  expect(() => runTemplateCli(['remove', 'ghost'])).toThrow('exit');
  expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
});

test('show prints template details', () => {
  runTemplateCli(['add', 'code', 'vscode://file/{file}:{line}', 'VS Code']);
  logSpy.mockClear();
  runTemplateCli(['show', 'code']);
  expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('vscode://file'));
});

test('apply outputs substituted string', () => {
  runTemplateCli(['add', 'tpl', '{file}:{line}:{col}', '']);
  logSpy.mockClear();
  runTemplateCli(['apply', 'tpl', '/app/index.ts', '99', '3']);
  expect(logSpy).toHaveBeenCalledWith('/app/index.ts:99:3');
});

test('unknown command prints usage', () => {
  runTemplateCli(['unknown']);
  expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Usage'));
});
