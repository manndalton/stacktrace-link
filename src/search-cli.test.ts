import { runSearchCli } from './search-cli';
import * as searchModule from './search';
import * as output from './output';

jest.mock('./search');
jest.mock('./output');

const mockSearch = searchModule.search as jest.Mock;
const mockPrintError = output.printError as jest.Mock;
const mockPrintInfo = output.printInfo as jest.Mock;

const mockResults = [
  { source: 'history', id: 'h1', label: '/app/src/index.ts', matchedText: 'TypeError: oops', timestamp: '2024-01-02T00:00:00Z' },
  { source: 'snapshot', id: 's1', label: 'crash-report', matchedText: 'crash-report', timestamp: '2024-01-01T00:00:00Z' },
];

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  mockSearch.mockReturnValue(mockResults);
  (output.colorize as jest.Mock).mockImplementation((s: string) => s);
});

afterEach(() => jest.restoreAllMocks());

test('prints usage when no args', () => {
  runSearchCli(['node', 'search-cli']);
  expect(console.log).toHaveBeenCalled();
  expect(mockSearch).not.toHaveBeenCalled();
});

test('prints usage with --help', () => {
  runSearchCli(['node', 'search-cli', '--help']);
  expect(console.log).toHaveBeenCalled();
});

test('calls search with query and prints results', () => {
  runSearchCli(['node', 'search-cli', 'TypeError']);
  expect(mockSearch).toHaveBeenCalledWith('TypeError');
  expect(console.log).toHaveBeenCalled();
});

test('filters by --source history', () => {
  runSearchCli(['node', 'search-cli', '--source', 'history', 'TypeError']);
  expect(mockSearch).toHaveBeenCalledWith('TypeError');
  // only history result should be printed
  const calls = (console.log as jest.Mock).mock.calls.flat().join(' ');
  expect(calls).toContain('history');
});

test('respects --limit flag', () => {
  const many = Array.from({ length: 30 }, (_, i) => ({
    source: 'history', id: `h${i}`, label: `file${i}.ts`, matchedText: 'err', timestamp: '2024-01-01T00:00:00Z',
  }));
  mockSearch.mockReturnValue(many);
  runSearchCli(['node', 'search-cli', '--limit', '5', 'err']);
  const calls = (console.log as jest.Mock).mock.calls.flat().join('\n');
  const matches = (calls.match(/file/g) || []).length;
  expect(matches).toBeLessThanOrEqual(5);
});

test('shows no results message when empty', () => {
  mockSearch.mockReturnValue([]);
  runSearchCli(['node', 'search-cli', 'nothinghere']);
  expect(mockPrintInfo).toHaveBeenCalled();
});

test('exits with error for blank query', () => {
  const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  expect(() => runSearchCli(['node', 'search-cli', '--source', 'history'])).toThrow('exit');
  expect(mockPrintError).toHaveBeenCalled();
  exit.mockRestore();
});
