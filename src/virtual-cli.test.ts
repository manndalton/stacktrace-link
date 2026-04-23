import { runAdd, runRemove, runList, runResolve } from './virtual-cli';
import { addVirtualMapping, listVirtualMappings, removeVirtualMapping } from './virtual';

beforeEach(() => {
  listVirtualMappings().forEach(m => removeVirtualMapping(m.alias));
});

const logs: string[] = [];
const errors: string[] = [];
beforeEach(() => {
  logs.length = 0;
  errors.length = 0;
  jest.spyOn(console, 'log').mockImplementation((...args) => logs.push(args.join(' ')));
  jest.spyOn(console, 'error').mockImplementation((...args) => errors.push(args.join(' ')));
});
afterEach(() => jest.restoreAllMocks());

test('runAdd registers a mapping and prints confirmation', () => {
  runAdd('<root>', '/home/user/project');
  expect(logs[0]).toContain('<root>');
  expect(logs[0]).toContain('/home/user/project');
  expect(listVirtualMappings()).toHaveLength(1);
});

test('runAdd exits on missing args', () => {
  const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  expect(() => runAdd('', '')).toThrow('exit');
  expect(errors[0]).toMatch(/required/);
  exit.mockRestore();
});

test('runRemove removes existing mapping', () => {
  addVirtualMapping('<tmp>', '/tmp');
  runRemove('<tmp>');
  expect(logs[0]).toContain('Removed');
  expect(listVirtualMappings()).toHaveLength(0);
});

test('runRemove exits for unknown alias', () => {
  const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  expect(() => runRemove('<nope>')).toThrow('exit');
  expect(errors[0]).toMatch(/No mapping/);
  exit.mockRestore();
});

test('runList prints all mappings', () => {
  addVirtualMapping('<a>', '/path/a');
  addVirtualMapping('<b>', '/path/b');
  runList();
  expect(logs).toHaveLength(2);
  expect(logs[0]).toContain('<a>');
  expect(logs[1]).toContain('<b>');
});

test('runList prints message when empty', () => {
  runList();
  expect(logs[0]).toMatch(/No virtual/);
});

test('runResolve resolves a virtual path', () => {
  addVirtualMapping('<src>', '/real/src');
  runResolve('<src>/index.ts');
  expect(logs[0]).toBe('/real/src/index.ts');
});

test('runResolve exits on missing path', () => {
  const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  expect(() => runResolve('')).toThrow('exit');
  exit.mockRestore();
});
