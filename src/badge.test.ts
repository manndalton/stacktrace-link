import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getBadgePath,
  loadBadges,
  saveBadges,
  addBadge,
  removeBadge,
  getBadge,
  formatBadgeSvg,
} from './badge';

function makeTempStore(tmp: string) {
  jest.spyOn(os, 'homedir').mockReturnValue(tmp);
}

describe('badge', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'badge-test-'));
    makeTempStore(tmp);
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  test('loadBadges returns empty array when no file', () => {
    expect(loadBadges()).toEqual([]);
  });

  test('addBadge persists a badge', () => {
    const b = addBadge('passing', '#4c1', 'src/foo.ts');
    expect(b.label).toBe('passing');
    expect(b.color).toBe('#4c1');
    expect(b.frameFile).toBe('src/foo.ts');
    expect(loadBadges()).toHaveLength(1);
  });

  test('addBadge without frameFile', () => {
    const b = addBadge('error', 'red');
    expect(b.frameFile).toBeUndefined();
  });

  test('removeBadge removes existing badge', () => {
    const b = addBadge('test', 'blue');
    expect(removeBadge(b.id)).toBe(true);
    expect(loadBadges()).toHaveLength(0);
  });

  test('removeBadge returns false for unknown id', () => {
    expect(removeBadge('nonexistent')).toBe(false);
  });

  test('getBadge returns correct badge', () => {
    const b = addBadge('info', 'gray');
    expect(getBadge(b.id)).toMatchObject({ label: 'info' });
  });

  test('getBadge returns undefined for unknown id', () => {
    expect(getBadge('missing')).toBeUndefined();
  });

  test('formatBadgeSvg returns valid SVG string', () => {
    const b = addBadge('build', '#0a0');
    const svg = formatBadgeSvg(b);
    expect(svg).toContain('<svg');
    expect(svg).toContain('build');
    expect(svg).toContain('#0a0');
  });

  test('saveBadges and loadBadges roundtrip', () => {
    const badges = [{ id: 'x', label: 'x', color: 'red', createdAt: new Date().toISOString() }];
    saveBadges(badges);
    expect(loadBadges()).toEqual(badges);
  });
});
