import { runList, runLoad, runRemove, printUsage } from './plugin-cli';
import { registerPlugin, unregisterPlugin, listPlugins } from './plugin';
import * as output from './output';

jest.mock('./output', () => ({
  printSuccess: jest.fn(),
  printError: jest.fn(),
  printInfo: jest.fn(),
}));

const mockSuccess = output.printSuccess as jest.Mock;
const mockError = output.printError as jest.Mock;
const mockInfo = output.printInfo as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  listPlugins()
    .map((p) => p.name)
    .forEach((n) => unregisterPlugin(n));
});

describe('runList', () => {
  it('prints info when no plugins registered', () => {
    runList();
    expect(mockInfo).toHaveBeenCalledWith('No plugins registered.');
  });

  it('prints each registered plugin', () => {
    registerPlugin({ name: 'my-plugin', version: '2.0.0', description: 'A plugin', hooks: {} });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runList();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('my-plugin@2.0.0'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('A plugin'));
    spy.mockRestore();
  });
});

describe('runLoad', () => {
  it('prints error and exits when no file provided', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runLoad('')).toThrow('exit');
    expect(mockError).toHaveBeenCalled();
    exit.mockRestore();
  });

  it('prints error and exits when file does not exist', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runLoad('/nonexistent/plugin.js')).toThrow('exit');
    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('Failed to load plugin'));
    exit.mockRestore();
  });
});

describe('runRemove', () => {
  it('prints error and exits when no name provided', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runRemove('')).toThrow('exit');
    expect(mockError).toHaveBeenCalled();
    exit.mockRestore();
  });

  it('removes an existing plugin', () => {
    registerPlugin({ name: 'removable', version: '1.0.0', hooks: {} });
    runRemove('removable');
    expect(mockSuccess).toHaveBeenCalledWith(expect.stringContaining('removable'));
  });

  it('prints error when plugin not found', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runRemove('ghost')).toThrow('exit');
    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('not found'));
    exit.mockRestore();
  });
});

describe('printUsage', () => {
  it('prints usage without throwing', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => printUsage()).not.toThrow();
    spy.mockRestore();
  });
});
