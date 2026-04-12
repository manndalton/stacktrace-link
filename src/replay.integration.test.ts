import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { addReplay, findReplay, loadReplays, removeReplay, clearReplays } from './replay';
import { formatEntry } from './replay-cli';

const origHome = os.homedir;
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'replay-int-'));
  (os as any).homedir = () => tmpDir;
});

afterEach(() => {
  (os as any).homedir = origHome;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const SAMPLE_TRACE = `Error: connect ECONNREFUSED 127.0.0.1:5432
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:16)
    at Object.<anonymous> (/home/user/project/src/db.ts:23:5)
    at Module._compile (internal/modules/cjs/loader.js:1137:30)`;

test('full lifecycle: add, find, format, remove', () => {
  const entry = addReplay(SAMPLE_TRACE, 'db-error');
  expect(entry.id).toBeTruthy();

  const found = findReplay(entry.id);
  expect(found).toBeDefined();
  expect(found!.input).toBe(SAMPLE_TRACE);
  expect(found!.label).toBe('db-error');

  const formatted = formatEntry(found!);
  expect(formatted).toContain('db-error');
  expect(formatted).toContain('Error: connect ECONNREFUSED');

  const removed = removeReplay(entry.id);
  expect(removed).toBe(true);
  expect(findReplay(entry.id)).toBeUndefined();
});

test('multiple replays persist across loadReplays calls', () => {
  addReplay('trace A', 'alpha');
  addReplay('trace B', 'beta');
  addReplay('trace C');

  const all = loadReplays();
  expect(all).toHaveLength(3);
  expect(all.map(e => e.label)).toEqual(['alpha', 'beta', undefined]);
});

test('clearReplays removes all entries and file is reset', () => {
  addReplay('x');
  addReplay('y');
  clearReplays();
  expect(loadReplays()).toEqual([]);

  // Adding after clear should work fine
  const e = addReplay('z', 'post-clear');
  expect(loadReplays()).toHaveLength(1);
  expect(loadReplays()[0].id).toBe(e.id);
});
