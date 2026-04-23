import { WatchModeSession } from './watch-mode';
import * as config from './config';
import * as editor from './editor';

jest.mock('./config');
jest.mock('./editor');

const mockLoadConfig = config.loadConfig as jest.Mock;
const mockOpenInEditor = editor.openInEditor as jest.Mock;

const REAL_TRACE = `Error: something went wrong
    at Object.<anonymous> (/home/user/project/src/app.ts:12:7)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1422:10)`;

function wait(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

beforeEach(() => {
  mockLoadConfig.mockResolvedValue({ exclude: ['node_modules', 'node:internal'] });
  mockOpenInEditor.mockResolvedValue('code /home/user/project/src/app.ts:12');
});

test('full pipeline: raw trace -> parsed frames -> history', async () => {
  const session = new WatchModeSession({ debounceMs: 10 });
  const traces: any[] = [];
  session.on('trace', e => traces.push(e));

  session.handleInput(REAL_TRACE);
  await wait(30);

  expect(traces).toHaveLength(1);
  const event = traces[0];
  expect(event.frames.length).toBeGreaterThan(0);
  expect(event.timestamp).toBeInstanceOf(Date);

  const history = session.getHistory();
  expect(history).toHaveLength(1);
  expect(history[0].raw).toBe(REAL_TRACE);

  session.destroy();
});

test('maxHistory trims oldest entries', async () => {
  const session = new WatchModeSession({ debounceMs: 5, maxHistory: 2 });
  const traces: any[] = [];
  session.on('trace', () => traces.push(true));

  for (let i = 0; i < 4; i++) {
    session.handleInput(REAL_TRACE);
    await wait(20);
  }

  expect(session.getHistory().length).toBeLessThanOrEqual(2);
  session.destroy();
});

test('autoOpen triggers openInEditor for first user frame', async () => {
  const session = new WatchModeSession({ debounceMs: 5, autoOpen: true });
  const opened: any[] = [];
  session.on('opened', e => opened.push(e));

  session.handleInput(REAL_TRACE);
  await wait(30);

  expect(mockOpenInEditor).toHaveBeenCalled();
  expect(opened.length).toBeGreaterThan(0);
  session.destroy();
});

test('destroy prevents further processing', async () => {
  const session = new WatchModeSession({ debounceMs: 10 });
  const traces: any[] = [];
  session.on('trace', e => traces.push(e));

  session.handleInput(REAL_TRACE);
  session.destroy();
  await wait(30);

  // After destroy the debounce timer is cleared, no trace should fire
  expect(traces).toHaveLength(0);
});
