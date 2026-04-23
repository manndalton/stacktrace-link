import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadTimeline,
  saveTimeline,
  addTimelineEntry,
  removeTimelineEntry,
  getTimelineEntry,
  clearTimeline,
} from './timeline';

function makeTempFile(): string {
  return path.join(os.tmpdir(), `timeline-test-${Date.now()}.json`);
}

describe('loadTimeline', () => {
  it('returns empty timeline when file does not exist', () => {
    const tl = loadTimeline('/nonexistent/path.json');
    expect(tl.entries).toEqual([]);
  });

  it('parses existing file', () => {
    const p = makeTempFile();
    const data = { entries: [{ id: 'tl-1', timestamp: 1, label: 'test', frames: [] }] };
    fs.writeFileSync(p, JSON.stringify(data));
    const tl = loadTimeline(p);
    expect(tl.entries).toHaveLength(1);
    fs.unlinkSync(p);
  });
});

describe('saveTimeline / loadTimeline round-trip', () => {
  it('persists entries', () => {
    const p = makeTempFile();
    const tl = { entries: [] };
    addTimelineEntry(tl, 'my-label', ['frame1', 'frame2'], 42);
    saveTimeline(tl, p);
    const loaded = loadTimeline(p);
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0].label).toBe('my-label');
    expect(loaded.entries[0].durationMs).toBe(42);
    fs.unlinkSync(p);
  });
});

describe('addTimelineEntry', () => {
  it('assigns a unique id and timestamp', () => {
    const tl = { entries: [] };
    const e = addTimelineEntry(tl, 'lbl', []);
    expect(e.id).toMatch(/^tl-/);
    expect(e.timestamp).toBeGreaterThan(0);
    expect(tl.entries).toHaveLength(1);
  });
});

describe('removeTimelineEntry', () => {
  it('removes by id and returns true', () => {
    const tl = { entries: [] };
    const e = addTimelineEntry(tl, 'x', []);
    expect(removeTimelineEntry(tl, e.id)).toBe(true);
    expect(tl.entries).toHaveLength(0);
  });

  it('returns false for unknown id', () => {
    const tl = { entries: [] };
    expect(removeTimelineEntry(tl, 'nope')).toBe(false);
  });
});

describe('getTimelineEntry', () => {
  it('finds entry by id', () => {
    const tl = { entries: [] };
    const e = addTimelineEntry(tl, 'find-me', ['f1']);
    expect(getTimelineEntry(tl, e.id)).toBe(e);
  });

  it('returns undefined for missing id', () => {
    expect(getTimelineEntry({ entries: [] }, 'x')).toBeUndefined();
  });
});

describe('clearTimeline', () => {
  it('empties all entries', () => {
    const tl = { entries: [] };
    addTimelineEntry(tl, 'a', []); addTimelineEntry(tl, 'b', []);
    clearTimeline(tl);
    expect(tl.entries).toHaveLength(0);
  });
});
