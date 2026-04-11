import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import {
  getNodeVersion,
  getPlatform,
  getEditorEnv,
  collectEnvInfo,
  formatEnvInfo,
  pathExistsSync,
} from './env';

describe('getNodeVersion', () => {
  it('returns a version string starting with v', () => {
    expect(getNodeVersion()).toMatch(/^v\d+\./);
  });
});

describe('getPlatform', () => {
  it('returns a non-empty string', () => {
    expect(typeof getPlatform()).toBe('string');
    expect(getPlatform().length).toBeGreaterThan(0);
  });
});

describe('getEditorEnv', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env.STACKTRACE_EDITOR = originalEnv.STACKTRACE_EDITOR;
    process.env.VISUAL = originalEnv.VISUAL;
    process.env.EDITOR = originalEnv.EDITOR;
  });

  it('prefers STACKTRACE_EDITOR', () => {
    process.env.STACKTRACE_EDITOR = 'subl';
    process.env.VISUAL = 'code';
    expect(getEditorEnv()).toBe('subl');
  });

  it('falls back to VISUAL', () => {
    delete process.env.STACKTRACE_EDITOR;
    process.env.VISUAL = 'nvim';
    expect(getEditorEnv()).toBe('nvim');
  });

  it('falls back to EDITOR', () => {
    delete process.env.STACKTRACE_EDITOR;
    delete process.env.VISUAL;
    process.env.EDITOR = 'vim';
    expect(getEditorEnv()).toBe('vim');
  });

  it('returns undefined when none set', () => {
    delete process.env.STACKTRACE_EDITOR;
    delete process.env.VISUAL;
    delete process.env.EDITOR;
    expect(getEditorEnv()).toBeUndefined();
  });
});

describe('pathExistsSync', () => {
  it('returns true for existing path', () => {
    expect(pathExistsSync(process.cwd())).toBe(true);
  });

  it('returns false for non-existing path', () => {
    expect(pathExistsSync('/no/such/path/__xyz__')).toBe(false);
  });
});

describe('collectEnvInfo', () => {
  it('returns an object with required fields', () => {
    const info = collectEnvInfo();
    expect(info).toHaveProperty('nodeVersion');
    expect(info).toHaveProperty('platform');
    expect(info).toHaveProperty('cwd');
    expect(info.cwd).toBe(process.cwd());
  });
});

describe('formatEnvInfo', () => {
  it('includes all keys in output', () => {
    const info = collectEnvInfo();
    const output = formatEnvInfo(info);
    expect(output).toContain('Node.js:');
    expect(output).toContain('Platform:');
    expect(output).toContain('CWD:');
    expect(output).toContain('Editor:');
    expect(output).toContain('Config:');
    expect(output).toContain('History:');
    expect(output).toContain('Snapshots:');
  });

  it('shows (not set) when editor is undefined', () => {
    const info = collectEnvInfo();
    info.editor = undefined;
    expect(formatEnvInfo(info)).toContain('(not set)');
  });
});
