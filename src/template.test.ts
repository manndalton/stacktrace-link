import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadTemplates,
  saveTemplates,
  addTemplate,
  removeTemplate,
  getTemplate,
  applyTemplate,
  getTemplatesPath,
} from './template';

const ORIG_HOME = os.homedir;

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stl-tmpl-'));
  jest.spyOn(os, 'homedir').mockReturnValue(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  jest.restoreAllMocks();
});

test('loadTemplates returns empty object when file missing', () => {
  expect(loadTemplates()).toEqual({});
});

test('addTemplate and loadTemplates round-trip', () => {
  addTemplate('vscode', { description: 'VS Code', pattern: 'vscode://file/{file}:{line}:{col}' });
  const templates = loadTemplates();
  expect(templates['vscode']).toBeDefined();
  expect(templates['vscode'].name).toBe('vscode');
  expect(templates['vscode'].pattern).toContain('{file}');
});

test('removeTemplate removes existing entry', () => {
  addTemplate('vim', { description: 'Vim', pattern: 'vim +{line} {file}' });
  const removed = removeTemplate('vim');
  expect(removed).toBe(true);
  expect(getTemplate('vim')).toBeUndefined();
});

test('removeTemplate returns false for unknown name', () => {
  expect(removeTemplate('nonexistent')).toBe(false);
});

test('getTemplate returns undefined for missing template', () => {
  expect(getTemplate('missing')).toBeUndefined();
});

test('applyTemplate substitutes placeholders', () => {
  const tpl = { name: 'test', description: 'Test', pattern: 'open {file}:{line}:{col}' };
  const result = applyTemplate(tpl, '/src/app.ts', 42, 7);
  expect(result).toBe('open /src/app.ts:42:7');
});

test('applyTemplate defaults col to 1', () => {
  const tpl = { name: 'test', description: 'Test', pattern: '{file}:{line}:{col}' };
  const result = applyTemplate(tpl, '/src/app.ts', 10);
  expect(result).toBe('/src/app.ts:10:1');
});

test('getTemplatesPath returns path under home dir', () => {
  const p = getTemplatesPath();
  expect(p).toContain('.stacktrace-link');
  expect(p).toContain('templates.json');
});
