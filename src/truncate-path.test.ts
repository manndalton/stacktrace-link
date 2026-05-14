import { truncatePath, truncatePathList, shortenCwd } from './truncate-path';
import * as path from 'path';

describe('truncatePath', () => {
  it('returns path unchanged when short enough', () => {
    expect(truncatePath('/foo/bar.ts', { maxLength: 60 })).toBe('/foo/bar.ts');
  });

  it('truncates long paths with ellipsis', () => {
    const long = '/home/user/projects/my-project/src/deeply/nested/module/file.ts';
    const result = truncatePath(long, { maxLength: 40 });
    expect(result.length).toBeLessThanOrEqual(40);
    expect(result).toContain('…');
  });

  it('keeps filename by default', () => {
    const long = '/home/user/projects/my-project/src/deeply/nested/file.ts';
    const result = truncatePath(long, { maxLength: 40 });
    expect(result).toContain('file.ts');
  });

  it('handles single segment path', () => {
    const long = 'averylongfilenamethatexceedsthemaximumlengthallowed.ts';
    const result = truncatePath(long, { maxLength: 20 });
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result).toContain('…');
  });

  it('respects custom maxLength', () => {
    const p = '/a/b/c/d/e/f/g.ts';
    const result = truncatePath(p, { maxLength: 10 });
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('returns path as-is when exactly at maxLength', () => {
    const p = '/foo/bar.ts'; // 11 chars
    expect(truncatePath(p, { maxLength: 11 })).toBe(p);
  });
});

describe('truncatePathList', () => {
  it('truncates all paths in a list', () => {
    const paths = [
      '/short.ts',
      '/home/user/projects/my-project/src/deeply/nested/module/file.ts',
    ];
    const results = truncatePathList(paths, { maxLength: 30 });
    expect(results).toHaveLength(2);
    expect(results[0]).toBe('/short.ts');
    expect(results[1].length).toBeLessThanOrEqual(30);
  });
});

describe('shortenCwd', () => {
  it('strips cwd prefix from path', () => {
    const cwd = '/home/user/project';
    const file = '/home/user/project/src/index.ts';
    expect(shortenCwd(file, cwd)).toBe('src/index.ts');
  });

  it('returns path unchanged when not under cwd', () => {
    const cwd = '/home/user/project';
    const file = '/other/path/file.ts';
    expect(shortenCwd(file, cwd)).toBe(file);
  });

  it('handles trailing separator in result', () => {
    const cwd = '/home/user/project';
    const file = '/home/user/project/file.ts';
    expect(shortenCwd(file, cwd)).toBe('file.ts');
  });
});
