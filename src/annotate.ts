import * as fs from 'fs';
import * as path from 'path';
import type { StackFrame } from './parser';

export interface Annotation {
  file: string;
  line: number;
  col?: number;
  text: string;
  author?: string;
  createdAt: string;
}

export interface AnnotationStore {
  annotations: Annotation[];
}

export function getAnnotationsPath(): string {
  const base = process.env.STACKTRACE_DATA_DIR ||
    path.join(process.env.HOME || '~', '.stacktrace-link');
  return path.join(base, 'annotations.json');
}

export function loadAnnotations(): AnnotationStore {
  const p = getAnnotationsPath();
  if (!fs.existsSync(p)) return { annotations: [] };
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as AnnotationStore;
  } catch {
    return { annotations: [] };
  }
}

export function saveAnnotations(store: AnnotationStore): void {
  const p = getAnnotationsPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(store, null, 2));
}

export function addAnnotation(
  file: string,
  line: number,
  text: string,
  col?: number,
  author?: string
): Annotation {
  const store = loadAnnotations();
  const annotation: Annotation = {
    file,
    line,
    col,
    text,
    author,
    createdAt: new Date().toISOString(),
  };
  store.annotations.push(annotation);
  saveAnnotations(store);
  return annotation;
}

export function removeAnnotation(file: string, line: number): boolean {
  const store = loadAnnotations();
  const before = store.annotations.length;
  store.annotations = store.annotations.filter(
    (a) => !(a.file === file && a.line === line)
  );
  if (store.annotations.length === before) return false;
  saveAnnotations(store);
  return true;
}

export function getAnnotationsForFrame(frame: StackFrame): Annotation[] {
  const store = loadAnnotations();
  return store.annotations.filter(
    (a) => a.file === frame.file && a.line === frame.line
  );
}

export function listAnnotations(): Annotation[] {
  return loadAnnotations().annotations;
}
