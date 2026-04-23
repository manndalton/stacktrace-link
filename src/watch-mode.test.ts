import { WatchModeSession, createWatchSession, DEFAULT_OPTIONS } from './watch-mode';
import * as parser from './parser';
import * as resolver from './resolver';
import * as config from './config';
import * as editor from './editor';

jest.mock('./parser');
jest.mock('./resolver');
jest.mock('./config');
jest.mock('./editor');

const mockParseStackTrace = parser.parseStackTrace as jest.Mock;
const mockResolveUserFrames = resolver.resolveUserFrames as jest.Mock;
const mockLoadConfig = config.loadConfig as jest.Mock;
const mockOpenInEditor = editor.openInEditor as jest.Mock;

const SAMPLE_FRAME = { file: '/app/src/index.ts', line: 10, column: 5, fn: 'main' };
const SAMPLE_RAW = 'Error: boom\n  at main (/app/src/index.ts:10:5)';

beforeEach(() => {
  jest.clearAllMocks();
  mockParseStackTrace.mockReturnValue([SAMPLE_FRAME]);
  mockResolveUserFrames.mockReturnValue([SAMPLE_FRAME]);
  mockLoadConfig.mockResolvedValue({});
  mockOpenInEditor.mockResolvedValue('code /app/src/index.ts:10');
});

function wait(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

test('DEFAULT_OPTIONS has expected shape', () => {
  expect(DEFAULT_OPTIONS.autoOpen).toBe(false);
  expect(DEFAULT_OPTIONS.debounceMs).toBeGreaterThan(0);
  expect(DEFAULT_OPTIONS.maxHistory).toBeGreaterThan(0);
});

test('createWatchSession returns a WatchModeSession', () => {
  const session = createWatchSession();
  expect(session).toBeInstanceOf(WatchModeSession);
  session.destroy();
});

test('emits trace event after debounce', async () => {
  const session = createWatchSession({ debounceMs: 10 });
  const events: any[] = [];
  session.on('trace', e => events.push(e));
  session.handleInput(SAMPLE_RAW);
  await wait(30);
  expect(events).toHaveLength(1);
  expect(events[0].frames).toEqual([SAMPLE_FRAME]);
  session.destroy();
});

test('debounce collapses rapid inputs', async () => {
  const session = createWatchSession({ debounceMs: 20 });
  const events: any[] = [];
  session.on('trace', e => events.push(e));
  session.handleInput(SAMPLE_RAW);
  session.handleInput(SAMPLE_RAW);
  session.handleInput(SAMPLE_RAW);
  await wait(50);
  expect(events).toHaveLength(1);
  session.destroy();
});

test('getHistory accumulates events', async () => {
  const session = createWatchSession({ debounceMs: 5 });
  session.handleInput(SAMPLE_RAW);
  await wait(20);
  session.handleInput(SAMPLE_RAW);
  await wait(20);
  expect(session.getHistory()).toHaveLength(2);
  session.destroy();
});

test('clearHistory empties history and emits cleared', async () => {
  const session = createWatchSession({ debounceMs: 5 });
  session.handleInput(SAMPLE_RAW);
  await wait(20);
  const cleared: boolean[] = [];
  session.on('cleared', () => cleared.push(true));
  session.clearHistory();
  expect(session.getHistory()).toHaveLength(0);
  expect(cleared).toHaveLength(1);
  session.destroy();
});

test('autoOpen calls openInEditor and emits opened', async () => {
  const session = createWatchSession({ debounceMs: 5, autoOpen: true });
  const opened: any[] = [];
  session.on('opened', e => opened.push(e));
  session.handleInput(SAMPLE_RAW);
  await wait(30);
  expect(mockOpenInEditor).toHaveBeenCalledWith(SAMPLE_FRAME.file, SAMPLE_FRAME.line);
  expect(opened[0].frame).toEqual(SAMPLE_FRAME);
  session.destroy();
});

test('no trace emitted when parseStackTrace returns empty', async () => {
  mockParseStackTrace.mockReturnValue([]);
  const session = createWatchSession({ debounceMs: 5 });
  const events: any[] = [];
  session.on('trace', e => events.push(e));
  session.handleInput('not a stack trace');
  await wait(20);
  expect(events).toHaveLength(0);
  session.destroy();
});
