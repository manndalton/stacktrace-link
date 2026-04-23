import { EventEmitter } from 'events';
import { parseStackTrace } from './parser';
import { resolveUserFrames } from './resolver';
import { loadConfig } from './config';
import { openInEditor } from './editor';
import type { StackFrame } from './parser';

export interface WatchModeOptions {
  autoOpen: boolean;
  debounceMs: number;
  maxHistory: number;
}

export interface WatchEvent {
  raw: string;
  frames: StackFrame[];
  timestamp: Date;
}

export const DEFAULT_OPTIONS: WatchModeOptions = {
  autoOpen: false,
  debounceMs: 200,
  maxHistory: 50,
};

export class WatchModeSession extends EventEmitter {
  private history: WatchEvent[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private options: WatchModeOptions;

  constructor(options: Partial<WatchModeOptions> = {}) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  handleInput(raw: string): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.process(raw), this.options.debounceMs);
  }

  private async process(raw: string): Promise<void> {
    const frames = parseStackTrace(raw);
    if (frames.length === 0) return;

    const config = await loadConfig();
    const userFrames = resolveUserFrames(frames, config);
    const event: WatchEvent = { raw, frames: userFrames, timestamp: new Date() };

    this.history.unshift(event);
    if (this.history.length > this.options.maxHistory) {
      this.history.pop();
    }

    this.emit('trace', event);

    if (this.options.autoOpen && userFrames.length > 0) {
      const first = userFrames[0];
      const cmd = await openInEditor(first.file, first.line);
      this.emit('opened', { frame: first, command: cmd });
    }
  }

  getHistory(): WatchEvent[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
    this.emit('cleared');
  }

  destroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.removeAllListeners();
  }
}

export function createWatchSession(options?: Partial<WatchModeOptions>): WatchModeSession {
  return new WatchModeSession(options);
}
