import * as path from 'path';
import * as fs from 'fs';

export interface VirtualFrame {
  file: string;
  line: number;
  column?: number;
  name?: string;
  virtual: true;
  originalFile?: string;
}

export interface VirtualMapping {
  alias: string;
  realPath: string;
}

const mappings: VirtualMapping[] = [];

export function addVirtualMapping(alias: string, realPath: string): void {
  const existing = mappings.findIndex(m => m.alias === alias);
  if (existing >= 0) {
    mappings[existing] = { alias, realPath };
  } else {
    mappings.push({ alias, realPath });
  }
}

export function removeVirtualMapping(alias: string): boolean {
  const idx = mappings.findIndex(m => m.alias === alias);
  if (idx < 0) return false;
  mappings.splice(idx, 1);
  return true;
}

export function listVirtualMappings(): VirtualMapping[] {
  return [...mappings];
}

export function resolveVirtualPath(filePath: string): string {
  for (const m of mappings) {
    if (filePath.startsWith(m.alias)) {
      return filePath.replace(m.alias, m.realPath);
    }
  }
  return filePath;
}

export function toVirtualFrame(file: string, line: number, column?: number, name?: string): VirtualFrame {
  const resolved = resolveVirtualPath(file);
  return {
    file: resolved,
    line,
    column,
    name,
    virtual: true,
    originalFile: resolved !== file ? file : undefined,
  };
}

export function virtualFileExists(filePath: string): boolean {
  const resolved = resolveVirtualPath(filePath);
  return fs.existsSync(resolved);
}
