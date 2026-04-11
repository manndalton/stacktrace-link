import { lintStackTrace, lintFile, getBuiltinRules, LintIssue } from './lint';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const sampleTrace = `Error: something went wrong
    at Object.<anonymous> (/home/user/project/src/index.ts:10:5)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)
    at Object.<anonymous> (/usr/lib/node/helper.js:3:1)
    at myFunc (/project/src/app.js:42:7)`;

describe('lintStackTrace', () => {
  it('returns empty array for clean trace', () => {
    const result = lintStackTrace('Error: oops\n    at myFunc (/project/src/app.ts:10:5)');
    const errors = result.filter(i => i.ruleId === 'no-absolute-path' || i.ruleId === 'no-node-internals');
    expect(errors.length).toBe(0);
  });

  it('detects node internal frames', () => {
    const issues = lintStackTrace(sampleTrace);
    const internal = issues.filter(i => i.ruleId === 'no-node-internals');
    expect(internal.length).toBeGreaterThan(0);
  });

  it('detects absolute system paths', () => {
    const issues = lintStackTrace(sampleTrace);
    const abs = issues.filter(i => i.ruleId === 'no-absolute-path');
    expect(abs.length).toBeGreaterThan(0);
  });

  it('detects missing source maps for .js frames', () => {
    const issues = lintStackTrace(sampleTrace);
    const sm = issues.filter(i => i.ruleId === 'missing-source-map');
    expect(sm.length).toBeGreaterThan(0);
  });

  it('respects custom rules', () => {
    const customRule = {
      id: 'custom',
      description: 'custom',
      check: (line: string, lineNumber: number) =>
        line.includes('myFunc') ? { ruleId: 'custom', message: 'found myFunc', line: lineNumber, severity: 'error' as const } : null
    };
    const issues = lintStackTrace(sampleTrace, [customRule]);
    expect(issues.some(i => i.ruleId === 'custom')).toBe(true);
  });
});

describe('lintFile', () => {
  it('lints a file and returns results', () => {
    const tmp = path.join(os.tmpdir(), `lint-test-${Date.now()}.txt`);
    fs.writeFileSync(tmp, sampleTrace);
    const result = lintFile(tmp);
    expect(result.file).toBe(path.resolve(tmp));
    expect(result.issues.length).toBeGreaterThan(0);
    fs.unlinkSync(tmp);
  });
});

describe('getBuiltinRules', () => {
  it('returns array of rules', () => {
    const rules = getBuiltinRules();
    expect(rules.length).toBe(3);
    expect(rules.map(r => r.id)).toContain('no-absolute-path');
  });
});
