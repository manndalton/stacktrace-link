/**
 * Filter utilities for stack frames.
 * Allows inclusion/exclusion rules based on path patterns.
 */

export interface FilterRule {
  pattern: string | RegExp;
  type: 'include' | 'exclude';
}

export interface FilterConfig {
  rules: FilterRule[];
  defaultAction: 'include' | 'exclude';
}

const DEFAULT_EXCLUDE_PATTERNS: RegExp[] = [
  /node_modules/,
  /internal\/modules/,
  /\(node:internal/,
];

export function matchesPattern(path: string, pattern: string | RegExp): boolean {
  if (typeof pattern === 'string') {
    return path.includes(pattern);
  }
  return pattern.test(path);
}

export function applyFilters(path: string, config?: FilterConfig): boolean {
  if (!config) {
    return !DEFAULT_EXCLUDE_PATTERNS.some((p) => matchesPattern(path, p));
  }

  for (const rule of config.rules) {
    if (matchesPattern(path, rule.pattern)) {
      return rule.type === 'include';
    }
  }

  return config.defaultAction === 'include';
}

export function buildFilterConfig(
  include: string[] = [],
  exclude: string[] = []
): FilterConfig {
  const rules: FilterRule[] = [
    ...include.map((pattern) => ({ pattern, type: 'include' as const })),
    ...exclude.map((pattern) => ({ pattern, type: 'exclude' as const })),
  ];
  return { rules, defaultAction: include.length > 0 ? 'exclude' : 'include' };
}
