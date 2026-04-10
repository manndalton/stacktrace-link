import { execSync } from 'child_process';
import type { StackFrame } from './parser';

export type EditorPreset = 'code' | 'cursor' | 'webstorm' | 'vim' | 'nvim';

const EDITOR_COMMANDS: Record<EditorPreset, (f: StackFrame) => string> = {
  code: (f) => `code --goto "${f.filePath}:${f.line}:${f.column}"`,
  cursor: (f) => `cursor --goto "${f.filePath}:${f.line}:${f.column}"`,
  webstorm: (f) => `webstorm --line ${f.line} "${f.filePath}"`,
  vim: (f) => `vim +${f.line} "${f.filePath}"`,
  nvim: (f) => `nvim +${f.line} "${f.filePath}"`,
};

export function buildEditorCommand(
  frame: StackFrame,
  editor: EditorPreset
): string {
  const builder = EDITOR_COMMANDS[editor];
  if (!builder) {
    throw new Error(`Unknown editor preset: "${editor}"`);
  }
  return builder(frame);
}

export function openInEditor(
  frame: StackFrame,
  editor: EditorPreset,
  dryRun = false
): string {
  const cmd = buildEditorCommand(frame, editor);
  if (!dryRun) {
    execSync(cmd, { stdio: 'inherit' });
  }
  return cmd;
}

export function detectEditor(): EditorPreset {
  const env = process.env.EDITOR ?? process.env.VISUAL ?? '';
  if (env.includes('code')) return 'code';
  if (env.includes('cursor')) return 'cursor';
  if (env.includes('webstorm')) return 'webstorm';
  if (env.includes('nvim')) return 'nvim';
  if (env.includes('vim')) return 'vim';
  return 'code'; // sensible default
}
