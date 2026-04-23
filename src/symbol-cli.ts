import * as path from 'path';
import * as fs from 'fs';
import { extractSymbols, findSymbol, formatSymbol, SymbolEntry } from './symbol';

function printUsage(): void {
  console.log(`Usage: stacktrace-link symbol <command> [options]

Commands:
  list <file>          List all symbols extracted from a file
  find <file> <name>   Find a specific symbol by name in a file
  search <dir> <name>  Search for a symbol across all .ts/.js files in a dir

Options:
  --help    Show this help message
`);
}

function runList(filePath: string): void {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  const symbols = extractSymbols(abs);
  if (symbols.length === 0) {
    console.log('No symbols found.');
    return;
  }
  for (const sym of symbols) {
    console.log(formatSymbol(sym));
  }
}

function runFind(filePath: string, name: string): void {
  const abs = path.resolve(filePath);
  const symbols = extractSymbols(abs);
  const sym = findSymbol(symbols, name);
  if (!sym) {
    console.error(`Symbol '${name}' not found in ${filePath}`);
    process.exit(1);
  }
  console.log(formatSymbol(sym));
}

function runSearch(dir: string, name: string): void {
  const abs = path.resolve(dir);
  const results: SymbolEntry[] = [];
  function walk(d: string) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        walk(full);
      } else if (entry.isFile() && /\.(ts|js)$/.test(entry.name)) {
        const syms = extractSymbols(full);
        const found = findSymbol(syms, name);
        if (found) results.push(found);
      }
    }
  }
  walk(abs);
  if (results.length === 0) {
    console.log(`No symbol '${name}' found under ${dir}`);
    return;
  }
  for (const sym of results) console.log(formatSymbol(sym));
}

export function runSymbolCli(argv: string[]): void {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === '--help') { printUsage(); return; }
  if (cmd === 'list' && rest[0]) { runList(rest[0]); return; }
  if (cmd === 'find' && rest[0] && rest[1]) { runFind(rest[0], rest[1]); return; }
  if (cmd === 'search' && rest[0] && rest[1]) { runSearch(rest[0], rest[1]); return; }
  printUsage();
}
