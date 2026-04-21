import fs from 'fs';
import path from 'path';
import os from 'os';

export interface Label {
  id: string;
  name: string;
  color?: string;
  description?: string;
  createdAt: string;
}

export interface LabelStore {
  labels: Label[];
}

export function getLabelsPath(): string {
  return path.join(os.homedir(), '.stacktrace-link', 'labels.json');
}

export function loadLabels(storePath = getLabelsPath()): LabelStore {
  try {
    const raw = fs.readFileSync(storePath, 'utf8');
    return JSON.parse(raw) as LabelStore;
  } catch {
    return { labels: [] };
  }
}

export function saveLabels(store: LabelStore, storePath = getLabelsPath()): void {
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
}

export function addLabel(name: string, color?: string, description?: string, storePath = getLabelsPath()): Label {
  const store = loadLabels(storePath);
  const existing = store.labels.find(l => l.name === name);
  if (existing) return existing;
  const label: Label = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    color,
    description,
    createdAt: new Date().toISOString(),
  };
  store.labels.push(label);
  saveLabels(store, storePath);
  return label;
}

export function removeLabel(name: string, storePath = getLabelsPath()): boolean {
  const store = loadLabels(storePath);
  const before = store.labels.length;
  store.labels = store.labels.filter(l => l.name !== name);
  if (store.labels.length === before) return false;
  saveLabels(store, storePath);
  return true;
}

export function getLabel(name: string, storePath = getLabelsPath()): Label | undefined {
  return loadLabels(storePath).labels.find(l => l.name === name);
}

export function listLabels(storePath = getLabelsPath()): Label[] {
  return loadLabels(storePath).labels;
}
