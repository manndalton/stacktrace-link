import {
  registerPlugin,
  unregisterPlugin,
  getPlugin,
  listPlugins,
  applyHook,
  Plugin,
} from './plugin';

function makePlugin(name: string, overrides: Partial<Plugin> = {}): Plugin {
  return { name, version: '1.0.0', hooks: {}, ...overrides };
}

// Reset registry between tests by unregistering known plugins
function cleanup(...names: string[]) {
  names.forEach((n) => unregisterPlugin(n));
}

describe('registerPlugin', () => {
  it('registers a plugin and retrieves it', () => {
    const p = makePlugin('test-reg');
    registerPlugin(p);
    expect(getPlugin('test-reg')).toBe(p);
    cleanup('test-reg');
  });

  it('throws when registering duplicate name', () => {
    const p = makePlugin('test-dup');
    registerPlugin(p);
    expect(() => registerPlugin(makePlugin('test-dup'))).toThrow('already registered');
    cleanup('test-dup');
  });
});

describe('unregisterPlugin', () => {
  it('returns true when plugin existed', () => {
    registerPlugin(makePlugin('test-unreg'));
    expect(unregisterPlugin('test-unreg')).toBe(true);
  });

  it('returns false when plugin did not exist', () => {
    expect(unregisterPlugin('nonexistent')).toBe(false);
  });
});

describe('listPlugins', () => {
  it('returns all registered plugins', () => {
    registerPlugin(makePlugin('list-a'));
    registerPlugin(makePlugin('list-b'));
    const names = listPlugins().map((p) => p.name);
    expect(names).toContain('list-a');
    expect(names).toContain('list-b');
    cleanup('list-a', 'list-b');
  });
});

describe('applyHook', () => {
  it('passes value through when no hooks defined', () => {
    const result = applyHook('beforeParse', 'hello');
    expect(result).toBe('hello');
  });

  it('transforms value through registered hook', () => {
    registerPlugin(
      makePlugin('hook-test', {
        hooks: { beforeParse: (input) => input.toUpperCase() },
      })
    );
    const result = applyHook('beforeParse', 'hello');
    expect(result).toBe('HELLO');
    cleanup('hook-test');
  });

  it('chains multiple hooks in order', () => {
    registerPlugin(makePlugin('chain-a', { hooks: { beforeParse: (s) => s + '-A' } }));
    registerPlugin(makePlugin('chain-b', { hooks: { beforeParse: (s) => s + '-B' } }));
    const result = applyHook('beforeParse', 'x');
    expect(result).toBe('x-A-B');
    cleanup('chain-a', 'chain-b');
  });
});
