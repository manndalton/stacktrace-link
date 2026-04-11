import { addTemplate, removeTemplate, loadTemplates, getTemplate, applyTemplate } from './template';

function printUsage(): void {
  console.log(`Usage: stacktrace-link template <command> [options]

Commands:
  list                        List all saved templates
  add <name> <pattern> [desc] Add or update a template
  remove <name>               Remove a template
  show <name>                 Show template details
  apply <name> <file> <line>  Apply a template with given values

Examples:
  stacktrace-link template add vscode 'vscode://file/{file}:{line}:{col}' 'VS Code'
  stacktrace-link template apply vscode /src/app.ts 42
`);
}

function runList(): void {
  const templates = loadTemplates();
  const names = Object.keys(templates);
  if (names.length === 0) {
    console.log('No templates saved.');
    return;
  }
  for (const name of names) {
    const t = templates[name];
    console.log(`  ${name.padEnd(16)} ${t.description || ''} — ${t.pattern}`);
  }
}

function runAdd(args: string[]): void {
  const [name, pattern, description = ''] = args;
  if (!name || !pattern) {
    console.error('Error: name and pattern are required.');
    process.exit(1);
  }
  addTemplate(name, { description, pattern });
  console.log(`Template '${name}' saved.`);
}

function runRemove(args: string[]): void {
  const [name] = args;
  if (!name) { console.error('Error: name is required.'); process.exit(1); }
  const ok = removeTemplate(name);
  if (!ok) { console.error(`Template '${name}' not found.`); process.exit(1); }
  console.log(`Template '${name}' removed.`);
}

function runShow(args: string[]): void {
  const [name] = args;
  if (!name) { console.error('Error: name is required.'); process.exit(1); }
  const t = getTemplate(name);
  if (!t) { console.error(`Template '${name}' not found.`); process.exit(1); }
  console.log(`Name:        ${t.name}`);
  console.log(`Description: ${t.description || '(none)'}`);
  console.log(`Pattern:     ${t.pattern}`);
}

function runApply(args: string[]): void {
  const [name, file, lineStr, colStr] = args;
  if (!name || !file || !lineStr) {
    console.error('Error: name, file and line are required.'); process.exit(1);
  }
  const t = getTemplate(name);
  if (!t) { console.error(`Template '${name}' not found.`); process.exit(1); }
  console.log(applyTemplate(t, file, parseInt(lineStr, 10), colStr ? parseInt(colStr, 10) : undefined));
}

export function runTemplateCli(argv: string[]): void {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'list': runList(); break;
    case 'add': runAdd(rest); break;
    case 'remove': runRemove(rest); break;
    case 'show': runShow(rest); break;
    case 'apply': runApply(rest); break;
    default: printUsage();
  }
}
