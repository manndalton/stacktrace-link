import {
  addVirtualMapping,
  removeVirtualMapping,
  listVirtualMappings,
  resolveVirtualPath,
  toVirtualFrame,
  virtualFileExists,
} from './virtual';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

beforeEach(() => {
  // Clear mappings between tests
  const mappings = listVirtualMappings();
  mappings.forEach(m => removeVirtualMapping(m.alias));
});

test('addVirtualMapping and listVirtualMappings', () => {
  addVirtualMapping('<root>', '/home/user/project');
  const list = listVirtualMappings();
  expect(list).toHaveLength(1);
  expect(list[0]).toEqual({ alias: '<root>', realPath: '/home/user/project' });
});

test('addVirtualMapping overwrites duplicate alias', () => {
  addVirtualMapping('<root>', '/old/path');
  addVirtualMapping('<root>', '/new/path');
  expect(listVirtualMappings()).toHaveLength(1);
  expect(listVirtualMappings()[0].realPath).toBe('/new/path');
});

test('removeVirtualMapping returns false for unknown alias', () => {
  expect(removeVirtualMapping('<unknown>')).toBe(false);
});

test('removeVirtualMapping removes existing mapping', () => {
  addVirtualMapping('<root>', '/home/user/project');
  expect(removeVirtualMapping('<root>')).toBe(true);
  expect(listVirtualMappings()).toHaveLength(0);
});

test('resolveVirtualPath replaces alias prefix', () => {
  addVirtualMapping('<root>', '/home/user/project');
  expect(resolveVirtualPath('<root>/src/index.ts')).toBe('/home/user/project/src/index.ts');
});

test('resolveVirtualPath returns original when no match', () => {
  expect(resolveVirtualPath('/absolute/path/file.ts')).toBe('/absolute/path/file.ts');
});

test('toVirtualFrame sets virtual flag and resolves file', () => {
  addVirtualMapping('<root>', '/real/path');
  const frame = toVirtualFrame('<root>/foo.ts', 10, 5, 'myFn');
  expect(frame.virtual).toBe(true);
  expect(frame.file).toBe('/real/path/foo.ts');
  expect(frame.originalFile).toBe('<root>/foo.ts');
  expect(frame.line).toBe(10);
  expect(frame.name).toBe('myFn');
});

test('toVirtualFrame has no originalFile when path unchanged', () => {
  const frame = toVirtualFrame('/some/file.ts', 1);
  expect(frame.originalFile).toBeUndefined();
});

test('virtualFileExists returns true for real file', () => {
  const tmp = path.join(os.tmpdir(), 'virtual-test-file.ts');
  fs.writeFileSync(tmp, '');
  addVirtualMapping('<tmp>', os.tmpdir());
  expect(virtualFileExists('<tmp>/virtual-test-file.ts')).toBe(true);
  fs.unlinkSync(tmp);
});
