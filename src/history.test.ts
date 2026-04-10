import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  loadHistory,
  saveHistory,
  addHistoryEntry,
  clearHistory,
  HistoryEntry,
} from './history';

const TMP_DIR = path.join(os.tmpdir(), 'stacktrace-link-test-history');
const TMP_FILE = path.join(TMP_DIR, 'history.json');

beforeEach(() => {
  if (fs.existsSync(TMP_FILE)) fs.unlinkSync(TMP_FILE);
  if (fs.existsSync(TMP_DIR)) fs.rmdirSync(TMP_DIR);
});

afterAll(() => {
  if (fs.existsSync(TMP_FILE)) fs.unlinkSync(TMP_FILE);
  if (fs.existsSync(TMP_DIR)) fs.rmdirSync(TMP_DIR);
});

describe('loadHistory', () => {
  it('returns empty array when file does not exist', () => {
    expect(loadHistory(TMP_FILE)).toEqual([]);
  });

  it('returns empty array for invalid JSON', () => {
    fs.mkdirSync(TMP_DIR, { recursive: true });
    fs.writeFileSync(TMP_FILE, 'not-json', 'utf8');
    expect(loadHistory(TMP_FILE)).toEqual([]);
  });

  it('returns parsed entries', () => {
    const entries: HistoryEntry[] = [
      { timestamp: 1000, file: '/app/index.ts', line: 10, editor: 'code' },
    ];
    fs.mkdirSync(TMP_DIR, { recursive: true });
    fs.writeFileSync(TMP_FILE, JSON.stringify(entries), 'utf8');
    expect(loadHistory(TMP_FILE)).toEqual(entries);
  });
});

describe('saveHistory', () => {
  it('creates directory and writes file', () => {
    const entries: HistoryEntry[] = [
      { timestamp: 2000, file: '/app/foo.ts', line: 5, editor: 'vim' },
    ];
    saveHistory(entries, TMP_FILE);
    expect(fs.existsSync(TMP_FILE)).toBe(true);
    expect(loadHistory(TMP_FILE)).toEqual(entries);
  });

  it('trims to last 100 entries', () => {
    const entries: HistoryEntry[] = Array.from({ length: 110 }, (_, i) => ({
      timestamp: i,
      file: `/app/file${i}.ts`,
      line: i,
      editor: 'code',
    }));
    saveHistory(entries, TMP_FILE);
    const loaded = loadHistory(TMP_FILE);
    expect(loaded.length).toBe(100);
    expect(loaded[0].timestamp).toBe(10);
  });
});

describe('addHistoryEntry', () => {
  it('appends an entry with a timestamp', () => {
    addHistoryEntry({ file: '/app/bar.ts', line: 3, editor: 'nano' }, TMP_FILE);
    const entries = loadHistory(TMP_FILE);
    expect(entries.length).toBe(1);
    expect(entries[0].file).toBe('/app/bar.ts');
    expect(typeof entries[0].timestamp).toBe('number');
  });
});

describe('clearHistory', () => {
  it('empties the history file', () => {
    addHistoryEntry({ file: '/app/baz.ts', line: 7, editor: 'code' }, TMP_FILE);
    clearHistory(TMP_FILE);
    expect(loadHistory(TMP_FILE)).toEqual([]);
  });
});
