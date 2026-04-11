import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadAliases,
  saveAliases,
  resolveAlias,
  addAlias,
  removeAlias,
} from './alias';

function makeTempFile(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'alias-test-'));
  const file = path.join(dir, '.stacktrace-aliases.json');
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('loadAliases', () => {
  it('returns empty object when file does not exist', () => {
    expect(loadAliases('/nonexistent/path.json')).toEqual({});
  });

  it('loads aliases from a valid JSON file', () => {
    const file = makeTempFile(JSON.stringify({ '@src': '/home/user/project/src' }));
    expect(loadAliases(file)).toEqual({ '@src': '/home/user/project/src' });
  });

  it('returns empty object on malformed JSON', () => {
    const file = makeTempFile('not json');
    expect(loadAliases(file)).toEqual({});
  });

  it('returns empty object when JSON is an array', () => {
    const file = makeTempFile('[]');
    expect(loadAliases(file)).toEqual({});
  });

  it('returns empty object when JSON is null', () => {
    const file = makeTempFile('null');
    expect(loadAliases(file)).toEqual({});
  });
});

describe('saveAliases', () => {
  it('writes aliases to file as formatted JSON', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'alias-save-'));
    const file = path.join(dir, 'aliases.json');
    saveAliases({ '@app': '/usr/app' }, file);
    const content = fs.readFileSync(file, 'utf-8');
    expect(JSON.parse(content)).toEqual({ '@app': '/usr/app' });
  });

  it('overwrites existing file content', () => {
    const file = makeTempFile(JSON.stringify({ '@old': '/old/path' }));
    saveAliases({ '@new': '/new/path' }, file);
    const content = fs.readFileSync(file, 'utf-8');
    expect(JSON.parse(content)).toEqual({ '@new': '/new/path' });
  });
});

describe('resolveAlias', () => {
  const aliases = { '@src': '/home/user/src', '@lib': '/home/user/lib' };

  it('replaces matching alias prefix', () => {
    expect(resolveAlias('@src/utils.ts', aliases)).toBe('/home/user/src/utils.ts');
  });

  it('returns original path when no alias matches', () => {
    expect(resolveAlias('/absolute/path.ts', aliases)).toBe('/absolute/path.ts');
  });

  it('resolves correct alias when multiple exist', () => {
    expect(resolveAlias('@lib/index.ts', aliases)).toBe('/home/user/lib/index.ts');
  });

  it('returns original path when aliases is empty', () => {
    expect(resolveAlias('@src/utils.ts', {})).toBe('@src/utils.ts');
  });
});

describe('addAlias / removeAlias', () => {
  it('adds a new alias', () => {
    const result = addAlias('@new', '/new/path', {});
    expect(result).toEqual({ '@new': '/new/path' });
  });

  it('overwrites an existing alias with the same key', () => {
    const result = addAlias('@src', '/updated/path', { '@src': '/old/path' });
    expect(result).toEqual({ '@src': '/updated/path' });
  });

  it('removes an existing alias', () => {
    const result = removeAlias('@old', { '@old': '/old', '@keep': '/keep' });
    expect(result).toEqual({ '@keep': '/keep' });
  });

  it('removeAlias is a no-op for missing alias', () => {
    const aliases = { '@a': '/a' };
    expect(removeAlias('@missing', aliases)).toEqual({ '@a': '/a' });
  });
});
