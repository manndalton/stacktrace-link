import * as fs from 'fs';
import * as path from 'path';

export interface LintRule {
  id: string;
  description: string;
  check: (line: string, lineNumber: number) => LintIssue | null;
}

export interface LintIssue {
  ruleId: string;
  message: string;
  line: number;
  severity: 'warning' | 'error';
}

export interface LintResult {
  file: string;
  issues: LintIssue[];
}

const builtinRules: LintRule[] = [
  {
    id: 'no-absolute-path',
    description: 'Stack frame should not reference absolute system paths outside project',
    check: (line, lineNumber) => {
      if (/at .+ \(\/(?:usr|home|root)\//.test(line)) {
        return { ruleId: 'no-absolute-path', message: 'Absolute system path detected in frame', line: lineNumber, severity: 'warning' };
      }
      return null;
    }
  },
  {
    id: 'no-node-internals',
    description: 'Stack frame references a Node.js internal module',
    check: (line, lineNumber) => {
      if (/at .+ \(node:/.test(line)) {
        return { ruleId: 'no-node-internals', message: 'Node.js internal module reference', line: lineNumber, severity: 'warning' };
      }
      return null;
    }
  },
  {
    id: 'missing-source-map',
    description: 'Frame points to a compiled file without a source map',
    check: (line, lineNumber) => {
      if (/\.js:\d+:\d+/.test(line) && !/\.ts:\d+:\d+/.test(line)) {
        return { ruleId: 'missing-source-map', message: 'Frame references compiled JS; consider enabling source maps', line: lineNumber, severity: 'warning' };
      }
      return null;
    }
  }
];

export function lintStackTrace(input: string, rules: LintRule[] = builtinRules): LintIssue[] {
  const lines = input.split('\n');
  const issues: LintIssue[] = [];
  lines.forEach((line, idx) => {
    for (const rule of rules) {
      const issue = rule.check(line, idx + 1);
      if (issue) issues.push(issue);
    }
  });
  return issues;
}

export function lintFile(filePath: string, rules?: LintRule[]): LintResult {
  const content = fs.readFileSync(filePath, 'utf8');
  return { file: path.resolve(filePath), issues: lintStackTrace(content, rules) };
}

export function getBuiltinRules(): LintRule[] {
  return [...builtinRules];
}
