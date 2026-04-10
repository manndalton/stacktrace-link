import { describe, it, expect } from 'vitest';
import {
  matchesPattern,
  applyFilters,
  buildFilterConfig,
} from './filter.js';

describe('matchesPattern', () => {
  it('matches string pattern by substring', () => {
    expect(matchesPattern('/home/user/project/src/app.ts', 'src')).toBe(true);
    expect(matchesPattern('/home/user/project/src/app.ts', 'test')).toBe(false);
  });

  it('matches regex pattern', () => {
    expect(matchesPattern('/home/user/node_modules/lib.js', /node_modules/)).toBe(true);
    expect(matchesPattern('/home/user/src/app.ts', /node_modules/)).toBe(false);
  });
});

describe('applyFilters', () => {
  it('excludes node_modules by default', () => {
    expect(applyFilters('/project/node_modules/express/index.js')).toBe(false);
  });

  it('includes user files by default', () => {
    expect(applyFilters('/project/src/app.ts')).toBe(true);
  });

  it('excludes internal node paths by default', () => {
    expect(applyFilters('(node:internal/modules/cjs/loader)')).toBe(false);
  });

  it('respects custom include rules', () => {
    const config = buildFilterConfig(['src'], []);
    expect(applyFilters('/project/src/app.ts', config)).toBe(true);
    expect(applyFilters('/project/lib/util.ts', config)).toBe(false);
  });

  it('respects custom exclude rules', () => {
    const config = buildFilterConfig([], ['vendor']);
    expect(applyFilters('/project/vendor/lib.js', config)).toBe(false);
    expect(applyFilters('/project/src/app.ts', config)).toBe(true);
  });

  it('include rules take priority over exclude when both match', () => {
    const config = buildFilterConfig(['src/special'], ['src']);
    expect(applyFilters('/project/src/special/file.ts', config)).toBe(true);
  });
});

describe('buildFilterConfig', () => {
  it('sets defaultAction to exclude when include patterns provided', () => {
    const config = buildFilterConfig(['src']);
    expect(config.defaultAction).toBe('exclude');
  });

  it('sets defaultAction to include when only exclude patterns provided', () => {
    const config = buildFilterConfig([], ['node_modules']);
    expect(config.defaultAction).toBe('include');
  });

  it('creates correct rule types', () => {
    const config = buildFilterConfig(['src'], ['vendor']);
    expect(config.rules[0].type).toBe('include');
    expect(config.rules[1].type).toBe('exclude');
  });
});
