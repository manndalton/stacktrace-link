import { redactHomedir, redactPatterns, redactFrame, redactStackTrace } from './redact';

describe('redactHomedir', () => {
  it('replaces home directory with ~', () => {
    const result = redactHomedir('/home/alice/projects/app/index.ts', '/home/alice');
    expect(result).toBe('~/projects/app/index.ts');
  });

  it('handles Windows-style home paths', () => {
    const result = redactHomedir('C:\\Users\\alice\\app\\index.ts', 'C:\\Users\\alice');
    expect(result).toBe('~\\app\\index.ts');
  });

  it('returns original text when home is empty', () => {
    const result = redactHomedir('/home/alice/file.ts', '');
    expect(result).toBe('/home/alice/file.ts');
  });
});

describe('redactPatterns', () => {
  it('replaces matching patterns with default replacement', () => {
    const result = redactPatterns('token=abc123def456', [/abc123def456/g]);
    expect(result).toBe('token=<redacted>');
  });

  it('replaces matching patterns with custom replacement', () => {
    const result = redactPatterns('secret=mysecret', [/mysecret/g], '[hidden]');
    expect(result).toBe('secret=[hidden]');
  });

  it('handles non-global patterns by making them global', () => {
    const result = redactPatterns('aaa bbb aaa', [/aaa/]);
    expect(result).toBe('<redacted> bbb <redacted>');
  });

  it('applies multiple patterns', () => {
    const result = redactPatterns('foo bar baz', [/foo/g, /baz/g]);
    expect(result).toBe('<redacted> bar <redacted>');
  });
});

describe('redactFrame', () => {
  it('redacts home directory in a stack frame', () => {
    const line = '    at Object.<anonymous> (/home/alice/app/index.ts:10:5)';
    const result = redactFrame(line, { homedir: '/home/alice' });
    expect(result).toContain('~/app/index.ts');
  });

  it('redacts long hex tokens', () => {
    const line = '    at handler (token: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4)';
    const result = redactFrame(line);
    expect(result).toContain('<redacted>');
    expect(result).not.toContain('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4');
  });

  it('applies custom patterns', () => {
    const line = '    at fn (secret-abc123)';
    const result = redactFrame(line, { patterns: [/secret-[a-z0-9]+/g] });
    expect(result).toContain('<redacted>');
  });
});

describe('redactStackTrace', () => {
  it('redacts each line of a multi-line trace', () => {
    const trace = [
      'Error: something went wrong',
      '    at Object.<anonymous> (/home/bob/app/index.ts:5:3)',
      '    at Module._compile (node:internal/modules/cjs/loader:1364:14)',
    ].join('\n');
    const result = redactStackTrace(trace, { homedir: '/home/bob' });
    expect(result).toContain('~/app/index.ts');
    expect(result).not.toContain('/home/bob');
  });
});
