import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { addHistoryEntry, clearHistory, loadHistory } from './history';

const TMP_DIR = path.join(os.tmpdir(), 'stacktrace-link-history-cli-test');
const TMP_FILE = path.join(TMP_DIR, 'history.json');

beforeEach(() => {
  process.env.STACKTRACE_HISTORY_PATH = TMP_FILE;
  if (fs.existsSync(TMP_FILE)) fs.unlinkSync(TMP_FILE);
  if (fs.existsSync(TMP_DIR)) fs.rmdirSync(TMP_DIR, { recursive: true } as any);
});

afterAll(() => {
  delete process.env.STACKTRACE_HISTORY_PATH;
  if (fs.existsSync(TMP_FILE)) fs.unlinkSync(TMP_FILE);
  if (fs.existsSync(TMP_DIR)) fs.rmdirSync(TMP_DIR, { recursive: true } as any);
});

describe('history integration', () => {
  it('records and retrieves entries in order', () => {
    addHistoryEntry({ file: '/app/a.ts', line: 1, editor: 'code' });
    addHistoryEntry({ file: '/app/b.ts', line: 2, editor: 'vim' });
    addHistoryEntry({ file: '/app/c.ts', line: 3, editor: 'code' });

    const entries = loadHistory();
    expect(entries.length).toBe(3);
    expect(entries[0].file).toBe('/app/a.ts');
    expect(entries[2].file).toBe('/app/c.ts');
  });

  it('stores column when provided', () => {
    addHistoryEntry({ file: '/app/d.ts', line: 10, column: 5, editor: 'code' });
    const entries = loadHistory();
    expect(entries[0].column).toBe(5);
  });

  it('clears all entries', () => {
    addHistoryEntry({ file: '/app/e.ts', line: 1, editor: 'nano' });
    clearHistory();
    expect(loadHistory()).toEqual([]);
  });

  it('persists across separate loadHistory calls', () => {
    addHistoryEntry({ file: '/app/f.ts', line: 99, editor: 'code' });
    const first = loadHistory();
    const second = loadHistory();
    expect(first).toEqual(second);
  });

  it('does not exceed max entries after many additions', () => {
    for (let i = 0; i < 110; i++) {
      addHistoryEntry({ file: `/app/file${i}.ts`, line: i, editor: 'code' });
    }
    const entries = loadHistory();
    expect(entries.length).toBe(100);
  });
});
