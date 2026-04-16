import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadPins, savePins, addPin, removePin, findPin, clearPins, getPinsPath } from './pin';

const ORIG_HOME = process.env.HOME;
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pin-test-'));
  process.env.HOME = tmpDir;
});

afterEach(() => {
  process.env.HOME = ORIG_HOME;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('loadPins returns empty array when no file', () => {
  expect(loadPins()).toEqual([]);
});

test('addPin persists a pin', () => {
  const pin = addPin('my error', '/app/src/index.ts', 10, 5);
  expect(pin.label).toBe('my error');
  expect(pin.file).toBe('/app/src/index.ts');
  expect(pin.line).toBe(10);
  expect(pin.column).toBe(5);
  const pins = loadPins();
  expect(pins).toHaveLength(1);
  expect(pins[0].id).toBe(pin.id);
});

test('removePin removes by id', () => {
  const pin = addPin('test', '/app/a.ts', 1);
  expect(removePin(pin.id)).toBe(true);
  expect(loadPins()).toHaveLength(0);
});

test('removePin returns false for unknown id', () => {
  expect(removePin('nonexistent')).toBe(false);
});

test('findPin returns pin by id', () => {
  const pin = addPin('find me', '/app/b.ts', 20);
  expect(findPin(pin.id)).toMatchObject({ label: 'find me' });
});

test('findPin returns undefined for unknown id', () => {
  expect(findPin('nope')).toBeUndefined();
});

test('clearPins removes all pins', () => {
  addPin('a', '/a.ts', 1);
  addPin('b', '/b.ts', 2);
  clearPins();
  expect(loadPins()).toHaveLength(0);
});
