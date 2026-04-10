import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildEditorCommand, detectEditor, openInEditor } from './editor';
import type { StackFrame } from './parser';

const frame: StackFrame = {
  functionName: 'myFn',
  filePath: '/home/user/project/src/app.ts',
  line: 42,
  column: 7,
};

describe('buildEditorCommand', () => {
  it('builds VS Code command', () => {
    expect(buildEditorCommand(frame, 'code')).toBe(
      'code --goto "/home/user/project/src/app.ts:42:7"'
    );
  });

  it('builds vim command', () => {
    expect(buildEditorCommand(frame, 'vim')).toBe(
      'vim +42 "/home/user/project/src/app.ts"'
    );
  });

  it('throws for unknown editor', () => {
    expect(() =>
      buildEditorCommand(frame, 'emacs' as never)
    ).toThrow('Unknown editor preset');
  });
});

describe('detectEditor', () => {
  beforeEach(() => {
    delete process.env.EDITOR;
    delete process.env.VISUAL;
  });

  it('detects code from EDITOR env', () => {
    process.env.EDITOR = '/usr/bin/code';
    expect(detectEditor()).toBe('code');
  });

  it('detects nvim from VISUAL env', () => {
    process.env.VISUAL = 'nvim';
    expect(detectEditor()).toBe('nvim');
  });

  it('defaults to code when env is unset', () => {
    expect(detectEditor()).toBe('code');
  });
});

describe('openInEditor', () => {
  it('returns the command in dry-run mode without executing', () => {
    const cmd = openInEditor(frame, 'code', true);
    expect(cmd).toContain('code --goto');
  });
});
