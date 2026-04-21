import {
  applyTransform,
  applyTransforms,
  makeRenameTransform,
  makePrefixTransform,
  makeStripTransform,
  buildTransformPipeline,
} from './transform';
import { StackFrame } from './parser';

function makeFrame(file: string): StackFrame {
  return { file, line: 1, column: 1, fn: 'test', raw: '' };
}

describe('applyTransform', () => {
  it('applies a transform function to a frame', () => {
    const frame = makeFrame('/home/user/project/src/index.ts');
    const fn = makeRenameTransform('/home/user/project', '/app');
    const result = applyTransform(frame, fn);
    expect(result.file).toBe('/app/src/index.ts');
  });
});

describe('applyTransforms', () => {
  it('applies multiple transforms in order', () => {
    const frames = [makeFrame('/home/user/src/foo.ts'), makeFrame('/home/user/src/bar.ts')];
    const fns = [
      makeStripTransform('/home/user'),
      makePrefixTransform('/app'),
    ];
    const results = applyTransforms(frames, fns);
    expect(results[0].file).toBe('/app/src/foo.ts');
    expect(results[1].file).toBe('/app/src/bar.ts');
  });
});

describe('makePrefixTransform', () => {
  it('adds prefix if not already present', () => {
    const fn = makePrefixTransform('/root');
    expect(fn(makeFrame('src/index.ts')).file).toBe('/rootsrc/index.ts');
  });

  it('does not double-add prefix', () => {
    const fn = makePrefixTransform('/root');
    expect(fn(makeFrame('/root/src/index.ts')).file).toBe('/root/src/index.ts');
  });
});

describe('makeStripTransform', () => {
  it('removes a prefix from the file path', () => {
    const fn = makeStripTransform('/home/user');
    expect(fn(makeFrame('/home/user/src/app.ts')).file).toBe('/src/app.ts');
  });
});

describe('buildTransformPipeline', () => {
  it('builds rename transform from config', () => {
    const pipeline = buildTransformPipeline([{ transforms: ['rename:/old:/new'] }]);
    expect(pipeline).toHaveLength(1);
    const frame = makeFrame('/old/src/index.ts');
    expect(pipeline[0](frame).file).toBe('/new/src/index.ts');
  });

  it('builds strip and prefix transforms', () => {
    const pipeline = buildTransformPipeline([{ transforms: ['strip:/home/user', 'prefix:/app'] }]);
    expect(pipeline).toHaveLength(2);
  });

  it('ignores unknown transform types', () => {
    const pipeline = buildTransformPipeline([{ transforms: ['unknown:foo'] }]);
    expect(pipeline).toHaveLength(0);
  });
});
