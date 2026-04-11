import { searchHistory, searchSnapshots, search, SearchResult } from './search';
import * as history from './history';
import * as snapshot from './snapshot';

jest.mock('./history');
jest.mock('./snapshot');

const mockHistory = history.loadHistory as jest.Mock;
const mockSnapshots = snapshot.listSnapshots as jest.Mock;

const historyFixture = [
  { id: 'h1', file: '/app/src/index.ts', error: 'TypeError: foo', timestamp: '2024-01-02T00:00:00Z' },
  { id: 'h2', file: '/app/src/utils.ts', error: 'RangeError: bar', timestamp: '2024-01-01T00:00:00Z' },
];

const snapshotFixture = [
  { id: 's1', name: 'login-error', frames: [{ file: '/app/src/auth.ts', line: 10, col: 5 }], createdAt: '2024-01-03T00:00:00Z' },
  { id: 's2', name: 'crash-report', frames: [{ file: '/app/src/index.ts', line: 3, col: 1 }], createdAt: '2024-01-04T00:00:00Z' },
];

beforeEach(() => {
  mockHistory.mockReturnValue(historyFixture);
  mockSnapshots.mockReturnValue(snapshotFixture);
});

test('searchHistory matches by file', () => {
  const results = searchHistory('utils');
  expect(results).toHaveLength(1);
  expect(results[0].id).toBe('h2');
  expect(results[0].source).toBe('history');
});

test('searchHistory matches by error message', () => {
  const results = searchHistory('TypeError');
  expect(results).toHaveLength(1);
  expect(results[0].id).toBe('h1');
});

test('searchHistory returns empty for no match', () => {
  expect(searchHistory('zzznomatch')).toHaveLength(0);
});

test('searchSnapshots matches by name', () => {
  const results = searchSnapshots('login');
  expect(results).toHaveLength(1);
  expect(results[0].id).toBe('s1');
  expect(results[0].source).toBe('snapshot');
});

test('searchSnapshots matches by frame file', () => {
  const results = searchSnapshots('index.ts');
  expect(results).toHaveLength(1);
  expect(results[0].id).toBe('s2');
});

test('search combines and sorts by timestamp desc', () => {
  const results = search('index.ts');
  expect(results.length).toBeGreaterThan(0);
  const timestamps = results.map(r => r.timestamp);
  expect(timestamps).toEqual([...timestamps].sort((a, b) => b.localeCompare(a)));
});

test('search returns empty for blank query', () => {
  expect(search('')).toHaveLength(0);
  expect(search('   ')).toHaveLength(0);
});
