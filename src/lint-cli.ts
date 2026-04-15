import { lintStackTrace, lintFile, getBuiltinRules, LintIssue } from './lint';
import { readFileSync } from 'fs';
import { colorize } from './output';

function printUsage(): void {
  console.log(`Usage: stacktrace-link lint [options] [file]

Lint a stack trace for common issues.

Options:
  --stdin         Read stack trace from stdin
  --rules         List available lint rules
  --severity=<s>  Filter by severity: warning|error
  -h, --help      Show this help

Examples:
  stacktrace-link lint trace.txt
  cat trace.txt | stacktrace-link lint --stdin`);
}

function formatIssue(issue: LintIssue): string {
  const icon = issue.severity === 'error' ? colorize('✖', 'red') : colorize('⚠', 'yellow');
  return `  ${icon} [${issue.ruleId}] Line ${issue.line}: ${issue.message}`;
}

/**
 * Prints a summary line showing counts of errors and warnings.
 */
function printSummary(issues: LintIssue[]): void {
  const errors = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  const parts: string[] = [];
  if (errors > 0) parts.push(colorize(`${errors} error(s)`, 'red'));
  if (warnings > 0) parts.push(colorize(`${warnings} warning(s)`, 'yellow'));
  console.log(`  ${parts.join(', ')}`);
}

export function runLintCli(argv: string[]): void {
  if (argv.includes('-h') || argv.includes('--help')) {
    printUsage();
    return;
  }

  if (argv.includes('--rules')) {
    const rules = getBuiltinRules();
    console.log(colorize('Built-in lint rules:', 'cyan'));
    rules.forEach(r => console.log(`  ${colorize(r.id, 'green')}: ${r.description}`));
    return;
  }

  const severityArg = argv.find(a => a.startsWith('--severity='));
  const severityFilter = severityArg ? severityArg.split('=')[1] : null;

  let issues: ReturnType<typeof lintStackTrace>;
  let source = '<stdin>';

  if (argv.includes('--stdin')) {
    const input = readFileSync('/dev/stdin', 'utf8');
    issues = lintStackTrace(input);
  } else {
    const file = argv.find(a => !a.startsWith('-'));
    if (!file) {
      console.error(colorize('Error: provide a file path or use --stdin', 'red'));
      process.exit(1);
    }
    const result = lintFile(file);
    issues = result.issues;
    source = result.file;
  }

  const filtered = severityFilter ? issues.filter(i => i.severity === severityFilter) : issues;

  if (filtered.length === 0) {
    console.log(colorize(`✔ No issues found in ${source}`, 'green'));
    return;
  }

  console.log(colorize(`Found ${filtered.length} issue(s) in ${source}:`, 'yellow'));
  filtered.forEach(issue => console.log(formatIssue(issue)));
  printSummary(filtered);
  process.exitCode = 1;
}
