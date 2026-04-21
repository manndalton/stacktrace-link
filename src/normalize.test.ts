import { toPosixPath, toRelativePath, stripPrefix, normalizeFrame, normalizeFrames } from './normalize';
import * as path from 'path';

const makeFrame = (file: string) => ({
  file,
  line: 1,
  column: 1,
  functionName: 'fn',
  raw: `at fn (${file}:1:1)`,
});

describe('toPosixPath', () => {
  it('converts backslashes to forward slashes', () => {
    expect(toPosixPath('C:\\Users\\foo\\bar.ts')).toBe('C:/Users/foo/bar.ts');
  });

  it('leaves posix paths unchanged', () => {
    expect(toPosixPath('/home/user/project/src/index.ts')).toBe('/home/user/project/src/index.ts');
  });
});

describe('toRelativePath', () => {
  it('makes an absolute path relative to cwd', () => {
    const cwd = '/home/user/project';
    const result = toRelativePath('/home/user/project/src/index.ts', cwd);
    expect(result).toBe(path.join('src', 'index.ts'));
  });

  it('resolves a relative path against cwd before making relative', () => {
    const cwd = '/home/user/project';
    const result = toRelativePath('src/index.ts', cwd);
    expect(result).toBe(path.join('src', 'index.ts'));
  });
});

describe('stripPrefix', () => {
  it('removes a matching prefix', () => {
    expect(stripPrefix('/app/src/index.ts', '/app/')).toBe('src/index.ts');
  });

  it('leaves the path unchanged when prefix does not match', () => {
    expect(stripPrefix('/other/src/index.ts', '/app/')).toBe('/other/src/index.ts');
  });
});

describe('normalizeFrame', () => {
  it('returns frame unchanged when no options given', () => {
    const frame = makeFrame('/abs/path/file.ts');
    expect(normalizeFrame(frame)).toEqual(frame);
  });

  it('applies toPosix conversion', () => {
    const frame = makeFrame('C:\\project\\src\\app.ts');
    expect(normalizeFrame(frame, { toPosix: true }).file).toBe('C:/project/src/app.ts');
  });

  it('strips prefix', () => {
    const frame = makeFrame('/app/src/index.ts');
    expect(normalizeFrame(frame, { stripPrefix: '/app/' }).file).toBe('src/index.ts');
  });

  it('makes path relative to cwd', () => {
    const frame = makeFrame('/home/user/project/src/index.ts');
    const result = normalizeFrame(frame, { cwd: '/home/user/project' });
    expect(result.file).toBe(path.join('src', 'index.ts'));
  });

  it('returns frame unchanged when file is undefined', () => {
    const frame = { ...makeFrame(''), file: undefined as any };
    expect(normalizeFrame(frame, { toPosix: true })).toEqual(frame);
  });
});

describe('normalizeFrames', () => {
  it('normalizes all frames in an array', () => {
    const frames = [
      makeFrame('C:\\project\\a.ts'),
      makeFrame('C:\\project\\b.ts'),
    ];
    const result = normalizeFrames(frames, { toPosix: true });
    expect(result[0].file).toBe('C:/project/a.ts');
    expect(result[1].file).toBe('C:/project/b.ts');
  });
});
