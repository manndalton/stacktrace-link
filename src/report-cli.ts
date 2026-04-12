import { generateReport, ReportSummary } from './report';
import { colorize, printError } from './output';

function printUsage(): void {
  console.log('Usage: stacktrace-link report [--json]');
  console.log('');
  console.log('Generate a summary report of stack trace activity.');
  console.log('');
  console.log('Options:');
  console.log('  --json    Output report as JSON');
  console.log('  --help    Show this help message');
}

function formatReport(report: ReportSummary): string {
  const lines: string[] = [];
  lines.push(colorize('bold', '=== Stack Trace Report ==='));
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Total traces recorded: ${report.totalTraces}`);
  lines.push(`Snapshots saved: ${report.snapshotCount}`);
  lines.push('');

  lines.push(colorize('bold', 'Top Files:'));
  if (report.topFiles.length === 0) {
    lines.push('  (none)');
  } else {
    for (const { file, count } of report.topFiles) {
      lines.push(`  ${count}x  ${file}`);
    }
  }
  lines.push('');

  lines.push(colorize('bold', 'Top Errors:'));
  if (report.topErrors.length === 0) {
    lines.push('  (none)');
  } else {
    for (const { message, count } of report.topErrors) {
      lines.push(`  ${count}x  ${message}`);
    }
  }

  return lines.join('\n');
}

export async function runReportCli(argv: string[]): Promise<void> {
  if (argv.includes('--help')) {
    printUsage();
    return;
  }

  const asJson = argv.includes('--json');

  try {
    const report = await generateReport();
    if (asJson) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(formatReport(report));
    }
  } catch (err: unknown) {
    printError(`Failed to generate report: ${(err as Error).message}`);
    process.exit(1);
  }
}
