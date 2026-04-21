import { parseArgs, runTransformCli } from './transform-cli';

const SAMPLE_TRACE = `Error: something went wrong
    at doThing (/home/user/project/src/app.ts:10:5)
    at main (/home/user/project/src/index.ts:20:3)
    at Object.<anonymous> (/home/user/project/src/index.ts:25:1)`;

describe('parseArgs', () => {
  it('parses --rename flag', () => {
    const result = parseArgs(['--rename', '/home/user:/app']);
    expect(result.transforms).toEqual(['rename:/home/user:/app']);
  });

  it('parses --prefix flag', () => {
    const result = parseArgs(['--prefix', '/root']);
    expect(result.transforms).toEqual(['prefix:/root']);
  });

  it('parses --strip flag', () => {
    const result = parseArgs(['--strip', '/home/user']);
    expect(result.transforms).toEqual(['strip:/home/user']);
  });

  it('parses --first flag', () => {
    const result = parseArgs(['--first']);
    expect(result.first).toBe(true);
  });

  it('parses --help flag', () => {
    const result = parseArgs(['--help']);
    expect(result.help).toBe(true);
  });

  it('parses multiple transforms', () => {
    const result = parseArgs(['--strip', '/home/user', '--prefix', '/app']);
    expect(result.transforms).toEqual(['strip:/home/user', 'prefix:/app']);
  });
});

describe('runTransformCli', () => {
  let output: string[];
  let errors: string[];

  beforeEach(() => {
    output = [];
    errors = [];
    jest.spyOn(console, 'log').mockImplementation((...args) => output.push(args.join(' ')));
    jest.spyOn(console, 'error').mockImplementation((...args) => errors.push(args.join(' ')));
  });

  afterEach(() => jest.restoreAllMocks());

  it('prints usage with --help', async () => {
    await runTransformCli(['--help'], '');
    expect(output.some(l => l.includes('Usage'))).toBe(true);
  });

  it('reports error on empty input', async () => {
    await runTransformCli([], '');
    expect(errors.some(e => e.includes('No stack frames'))).toBe(true);
  });

  it('applies rename transform and prints frames', async () => {
    await runTransformCli(['--rename', '/home/user/project:/app'], SAMPLE_TRACE);
    expect(output.some(l => l.includes('/app/src/app.ts'))).toBe(true);
  });

  it('--first prints only the first user frame', async () => {
    await runTransformCli(['--first', '--strip', '/home/user/project'], SAMPLE_TRACE);
    expect(output.length).toBeGreaterThan(0);
    expect(output[output.length - 1]).toMatch(/src\/app\.ts:10/);
  });
});
