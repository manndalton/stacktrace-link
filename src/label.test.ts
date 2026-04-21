import fs from 'fs';
import os from 'os';
import path from 'path';
import { addLabel, removeLabel, listLabels, getLabel, loadLabels } from './label';

function makeTempStore(): string {
  return path.join(os.tmpdir(), `label-test-${Date.now()}.json`);
}

test('addLabel creates a new label', () => {
  const store = makeTempStore();
  const label = addLabel('bug', 'red', 'A bug label', store);
  expect(label.name).toBe('bug');
  expect(label.color).toBe('red');
  expect(label.description).toBe('A bug label');
  expect(label.id).toBeTruthy();
  expect(label.createdAt).toBeTruthy();
});

test('addLabel returns existing label without duplicate', () => {
  const store = makeTempStore();
  const a = addLabel('feature', undefined, undefined, store);
  const b = addLabel('feature', undefined, undefined, store);
  expect(a.id).toBe(b.id);
  expect(loadLabels(store).labels).toHaveLength(1);
});

test('listLabels returns all labels', () => {
  const store = makeTempStore();
  addLabel('alpha', 'blue', undefined, store);
  addLabel('beta', 'green', undefined, store);
  const labels = listLabels(store);
  expect(labels).toHaveLength(2);
  expect(labels.map(l => l.name)).toEqual(['alpha', 'beta']);
});

test('getLabel finds label by name', () => {
  const store = makeTempStore();
  addLabel('hotfix', 'orange', 'urgent fix', store);
  const found = getLabel('hotfix', store);
  expect(found).toBeDefined();
  expect(found!.color).toBe('orange');
});

test('getLabel returns undefined for missing label', () => {
  const store = makeTempStore();
  expect(getLabel('nonexistent', store)).toBeUndefined();
});

test('removeLabel removes existing label', () => {
  const store = makeTempStore();
  addLabel('temp', undefined, undefined, store);
  const result = removeLabel('temp', store);
  expect(result).toBe(true);
  expect(listLabels(store)).toHaveLength(0);
});

test('removeLabel returns false for missing label', () => {
  const store = makeTempStore();
  expect(removeLabel('ghost', store)).toBe(false);
});

test('loadLabels returns empty store when file missing', () => {
  const store = makeTempStore();
  const result = loadLabels(store);
  expect(result.labels).toEqual([]);
});
