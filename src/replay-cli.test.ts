import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { formatEntry, runSave, runList, runRemove, runClear } from './replay-cli';
import { loadReplays, addReplay, clearReplays } from './replay';

const origHome = os.homedir;

beforeEach(() => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'replay-cli-test-'));
  (os as any).homedir = () => tmp;
});

afterEach(() => {
  (os as any).homedir = origHome;
  jest.restoreAllMocks();
});

test('formatEntry includes id, date and preview', () => {
  const entry = addReplay('Error: something failed\n  at foo (bar.ts:10:5)', 'my-label');
  const out = formatEntry(entry);
  expect(out).toContain(entry.id);
  expect(out).toContain('[my-label]');
  expect(out).toContain('Error: something failed');
});

test('formatEntry without label', () => {
  const entry = addReplay('trace');
  const out = formatEntry(entry);
  expect(out).not.toContain('[');
});

test('runSave logs saved id', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runSave('some trace data', 'lbl');
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('Saved replay:'));
  expect(loadReplays()).toHaveLength(1);
});

test('runList prints no replays message when empty', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runList();
  expect(spy).toHaveBeenCalledWith('No replays saved.');
});

test('runList prints entries', () => {
  addReplay('trace1', 'first');
  addReplay('trace2');
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runList();
  expect(spy).toHaveBeenCalledTimes(2);
});

test('runRemove removes existing entry', () => {
  const entry = addReplay('data');
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runRemove(entry.id);
  expect(loadReplays()).toHaveLength(0);
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('Removed'));
});

test('runRemove exits on unknown id', () => {
  const spy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  jest.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => runRemove('ghost')).toThrow('exit');
});

test('runClear empties replays', () => {
  addReplay('a');
  addReplay('b');
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runClear();
  expect(loadReplays()).toHaveLength(0);
  expect(spy).toHaveBeenCalledWith('All replays cleared.');
});
