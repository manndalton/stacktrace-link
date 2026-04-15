import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ScopeEntry {
  name: string;
  rootDir: string;
  include: string[];
  exclude: string[];
  createdAt: string;
}

export interface ScopeStore {
  active: string | null;
  scopes: Record<string, ScopeEntry>;
}

export function getScopePath(): string {
  return path.join(os.homedir(), '.stacktrace-link', 'scopes.json');
}

export function loadScopes(): ScopeStore {
  const p = getScopePath();
  if (!fs.existsSync(p)) return { active: null, scopes: {} };
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as ScopeStore;
  } catch {
    return { active: null, scopes: {} };
  }
}

export function saveScopes(store: ScopeStore): void {
  const p = getScopePath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(store, null, 2));
}

export function addScope(name: string, rootDir: string, include: string[], exclude: string[]): ScopeEntry {
  const store = loadScopes();
  const entry: ScopeEntry = { name, rootDir, include, exclude, createdAt: new Date().toISOString() };
  store.scopes[name] = entry;
  saveScopes(store);
  return entry;
}

export function removeScope(name: string): boolean {
  const store = loadScopes();
  if (!store.scopes[name]) return false;
  delete store.scopes[name];
  if (store.active === name) store.active = null;
  saveScopes(store);
  return true;
}

export function setActiveScope(name: string | null): void {
  const store = loadScopes();
  if (name !== null && !store.scopes[name]) throw new Error(`Scope not found: ${name}`);
  store.active = name;
  saveScopes(store);
}

export function getActiveScope(): ScopeEntry | null {
  const store = loadScopes();
  if (!store.active) return null;
  return store.scopes[store.active] ?? null;
}

export function matchesScope(filePath: string, scope: ScopeEntry): boolean {
  if (!filePath.start false;
  const rel = filePath.slice(scope.rootDir.length).replace(/^\//, '');
  if (scope.exclude.some(p return false;
  if (scope.include.length === 0) return true;
  return scope.include.some(p => rel.startsWith(p));
}
