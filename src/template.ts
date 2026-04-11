import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Template {
  name: string;
  description: string;
  pattern: string;
  editorArgs?: string[];
}

export interface TemplateMap {
  [name: string]: Template;
}

const TEMPLATES_FILE = path.join(os.homedir(), '.stacktrace-link', 'templates.json');

export function getTemplatesPath(): string {
  return TEMPLATES_FILE;
}

export function loadTemplates(): TemplateMap {
  if (!fs.existsSync(TEMPLATES_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(TEMPLATES_FILE, 'utf8');
    return JSON.parse(raw) as TemplateMap;
  } catch {
    return {};
  }
}

export function saveTemplates(templates: TemplateMap): void {
  const dir = path.dirname(TEMPLATES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf8');
}

export function addTemplate(name: string, template: Omit<Template, 'name'>): void {
  const templates = loadTemplates();
  templates[name] = { name, ...template };
  saveTemplates(templates);
}

export function removeTemplate(name: string): boolean {
  const templates = loadTemplates();
  if (!templates[name]) return false;
  delete templates[name];
  saveTemplates(templates);
  return true;
}

export function getTemplate(name: string): Template | undefined {
  const templates = loadTemplates();
  return templates[name];
}

export function applyTemplate(template: Template, file: string, line: number, col?: number): string {
  return template.pattern
    .replace('{file}', file)
    .replace('{line}', String(line))
    .replace('{col}', String(col ?? 1));
}
