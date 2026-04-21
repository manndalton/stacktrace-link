import { runAdd, runRemove, runList, runShow, printUsage } from './label-cli';
import { addLabel, listLabels, getLabelsPath } from './label';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Redirect label store for tests by mocking getLabelsPath
const tempStore = path.join(os.tmpdir(), `label-cli-test-${Date.now()}.json`);

jest.mock('./label', () => {
  const actual = jest.requireActual('./label');
  return {
    ...actual,
    getLabelsPath: () => tempStore,
  };
});

afterEach(() => {
  if (fs.existsSync(tempStore)) fs.unlinkSync(tempStore);
});

test('printUsage outputs usage info', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  printUsage();
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('Usage'));
  spy.mockRestore();
});

test('runAdd adds a label and prints confirmation', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runAdd(['critical', '--color', 'red', '--desc', 'high priority']);
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('critical'));
  spy.mockRestore();
});

test('runAdd exits on missing name', () => {
  const spy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  const err = jest.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => runAdd([])).toThrow('exit');
  spy.mockRestore();
  err.mockRestore();
});

test('runList prints labels', () => {
  const { addLabel } = jest.requireActual('./label');
  addLabel('one', 'blue', undefined, tempStore);
  addLabel('two', undefined, 'desc', tempStore);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runList();
  expect(spy).toHaveBeenCalledTimes(2);
  spy.mockRestore();
});

test('runList prints empty message when no labels', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runList();
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('No labels'));
  spy.mockRestore();
});

test('runRemove removes a label', () => {
  const { addLabel } = jest.requireActual('./label');
  addLabel('todelete', undefined, undefined, tempStore);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runRemove(['todelete']);
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('Removed'));
  spy.mockRestore();
});

test('runShow prints label json', () => {
  const { addLabel } = jest.requireActual('./label');
  addLabel('showme', 'purple', 'test', tempStore);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  runShow(['showme']);
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('showme'));
  spy.mockRestore();
});
