import { watchStdin, watchFile, WatchOptions } from './watcher';
import * as parser from './parser';
import * as resolver from './resolver';
import * as editor from './editor';
import * as output from './output';
import * as fs from 'fs';

jest.mock('./parser');
jest.mock('./resolver');
jest.mock('./editor');
jest.mock('./output');
jest.mock('./config', () => ({ loadConfig: jest.fn(() => ({ editor: 'code', rootDir: '/project' })) }));

const mockParseStackTrace = parser.parseStackTrace as jest.Mock;
const mockFirstUserFrame = parser.firstUserFrame as jest.Mock;
const mockResolveFrame = resolver.resolveFrame as jest.Mock;
const mockBuildEditorCommand = editor.buildEditorCommand as jest.Mock;
const mockOpenInEditor = editor.openInEditor as jest.Mock;
const mockPrintSuccess = output.printSuccess as jest.Mock;
const mockPrintError = output.printError as jest.Mock;
const mockPrintInfo = output.printInfo as jest.Mock;

const mockFrame = { file: 'src/index.ts', line: 10, column: 5, fn: 'main' };
const mockResolved = { absolutePath: '/project/src/index.ts', line: 10, column: 5 };

beforeEach(() => {
  jest.clearAllMocks();
  mockParseStackTrace.mockReturnValue([mockFrame]);
  mockFirstUserFrame.mockReturnValue(mockFrame);
  mockResolveFrame.mockReturnValue(mockResolved);
  mockBuildEditorCommand.mockReturnValue('code --goto /project/src/index.ts:10:5');
});

describe('watchFile', () => {
  it('should watch a file and open editor on change', () => {
    const fakeWatcher = { close: jest.fn() } as unknown as fs.FSWatcher;
    const watchSpy = jest.spyOn(fs, 'watch').mockImplementation((_path, cb) => {
      (cb as Function)('change', 'test.log');
      return fakeWatcher;
    });
    jest.spyOn(fs, 'readFileSync').mockReturnValue('Error\n  at main (src/index.ts:10:5)');

    const watcher = watchFile('/tmp/test.log', { autoOpen: true });

    expect(mockPrintInfo).toHaveBeenCalledWith(expect.stringContaining('/tmp/test.log'));
    expect(mockResolveFrame).toHaveBeenCalledWith(mockFrame, expect.anything());
    expect(mockOpenInEditor).toHaveBeenCalled();
    expect(watcher).toBe(fakeWatcher);

    watchSpy.mockRestore();
  });

  it('should not open editor when autoOpen is false', () => {
    const fakeWatcher = { close: jest.fn() } as unknown as fs.FSWatcher;
    jest.spyOn(fs, 'watch').mockImplementation((_path, cb) => {
      (cb as Function)('change', 'test.log');
      return fakeWatcher;
    });
    jest.spyOn(fs, 'readFileSync').mockReturnValue('Error\n  at main (src/index.ts:10:5)');

    watchFile('/tmp/test.log', { autoOpen: false });

    expect(mockOpenInEditor).not.toHaveBeenCalled();
  });

  it('should handle unresolvable frames gracefully', () => {
    mockResolveFrame.mockReturnValue(null);
    const fakeWatcher = { close: jest.fn() } as unknown as fs.FSWatcher;
    jest.spyOn(fs, 'watch').mockImplementation((_path, cb) => {
      (cb as Function)('change', 'test.log');
      return fakeWatcher;
    });
    jest.spyOn(fs, 'readFileSync').mockReturnValue('Error\n  at main (src/index.ts:10:5)');

    watchFile('/tmp/test.log');

    expect(mockOpenInEditor).not.toHaveBeenCalled();
    expect(mockPrintSuccess).not.toHaveBeenCalled();
  });
});
