import { parseArgs, printUsage } from './diff-cli';
import { jest } from '@jest/globals';

describe('parseArgs', () => {
  it('parses two snapshot ids', () => {
    const result = parseArgs(['node', 'diff-cli', 'snap-abc', 'snap-def']);
    expect(result.idA).toBe('snap-abc');
    expect(result.idB).toBe('snap-def');
    expect(result.json).toBe(false);
    expect(result.help).toBe(false);
  });

  it('parses --json flag', () => {
    const result = parseArgs(['node', 'diff-cli', 'snap-abc', 'snap-def', '--json']);
    expect(result.json).toBe(true);
    expect(result.idA).toBe('snap-abc');
    expect(result.idB).toBe('snap-def');
  });

  it('parses --help flag', () => {
    const result = parseArgs(['node', 'diff-cli', '--help']);
    expect(result.help).toBe(true);
  });

  it('returns empty strings when positional args are missing', () => {
    const result = parseArgs(['node', 'diff-cli']);
    expect(result.idA).toBe('');
    expect(result.idB).toBe('');
  });

  it('ignores flags when collecting positional args', () => {
    const result = parseArgs(['node', 'diff-cli', '--json', 'snap-aaa', 'snap-bbb']);
    expect(result.idA).toBe('snap-aaa');
    expect(result.idB).toBe('snap-bbb');
    expect(result.json).toBe(true);
  });
});

describe('printUsage', () => {
  it('prints usage without throwing', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => printUsage()).not.toThrow();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
