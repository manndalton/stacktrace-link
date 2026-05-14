import { StackFrame } from './parser';

export interface MaskOptions {
  maskFilePaths?: boolean;
  maskFunctionNames?: boolean;
  maskLineNumbers?: boolean;
  placeholder?: string;
}

const DEFAULT_PLACEHOLDER = '***';

export function maskFilePath(filePath: string, placeholder: string): string {
  const parts = filePath.split('/');
  return parts
    .map((part, i) => (i === parts.length - 1 ? part : placeholder))
    .join('/');
}

export function maskFunctionName(name: string | undefined, placeholder: string): string {
  if (!name) return placeholder;
  return placeholder;
}

export function maskFrame(frame: StackFrame, opts: MaskOptions): StackFrame {
  const ph = opts.placeholder ?? DEFAULT_PLACEHOLDER;
  return {
    ...frame,
    file: opts.maskFilePaths ? maskFilePath(frame.file, ph) : frame.file,
    function: opts.maskFunctionNames ? maskFunctionName(frame.function, ph) : frame.function,
    line: opts.maskLineNumbers ? 0 : frame.line,
    column: opts.maskLineNumbers ? 0 : frame.column,
  };
}

export function maskFrames(frames: StackFrame[], opts: MaskOptions): StackFrame[] {
  return frames.map(f => maskFrame(f, opts));
}

export function buildMaskOptions(args: Record<string, unknown>): MaskOptions {
  return {
    maskFilePaths: Boolean(args['--files'] ?? args['-f']),
    maskFunctionNames: Boolean(args['--functions'] ?? args['-n']),
    maskLineNumbers: Boolean(args['--lines'] ?? args['-l']),
    placeholder: typeof args['--placeholder'] === 'string' ? args['--placeholder'] : DEFAULT_PLACEHOLDER,
  };
}
