import * as fs from 'fs';
import * as path from 'path';
import { loadHistory, HistoryEntry } from './history';
import { loadSnapshots, Snapshot } from './snapshot';

export interface SearchResult {
  source: 'history' | 'snapshot';
  id: string;
  label: string;
  matchedText: string;
  timestamp: string;
}

export function searchHistory(query: string): SearchResult[] {
  const entries: HistoryEntry[] = loadHistory();
  const lower = query.toLowerCase();
  return entries
    .filter(e =>
      e.file.toLowerCase().includes(lower) ||
      (e.error && e.error.toLowerCase().includes(lower))
    )
    .map(e => ({
      source: 'history' as const,
      id: e.id,
      label: e.file,
      matchedText: e.error || e.file,
      timestamp: e.timestamp,
    }));
}

export function searchSnapshots(query: string): SearchResult[] {
  const snapshots: Snapshot[] = listSnapshots();
  const lower = query.toLowerCase();
  return snapshots
    .filter(s =>
      s.name.toLowerCase().includes(lower) ||
      s.frames.some(f => f.file.toLowerCase().includes(lower))
    )
    .map(s => ({
      source: 'snapshot' as const,
      id: s.id,
      label: s.name,
      matchedText: s.name,
      timestamp: s.createdAt,
    }));
}

export function search(query: string): SearchResult[] {
  if (!query || query.trim() === '') return [];
  return [
    ...searchHistory(query),
    ...searchSnapshots(query),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function listSnapshots(): Snapshot[] {
  try {
    const { listSnapshots: ls } = require('./snapshot');
    return ls();
  } catch {
    return [];
  }
}
