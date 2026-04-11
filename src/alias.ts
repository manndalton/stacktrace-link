import * as fs from 'fs';
import * as path from 'path';

export interface AliasMap {
  [alias: string]: string;
}

export function loadAliases(configPath?: string): AliasMap {
  const filePath = configPath ?? path.join(process.cwd(), '.stacktrace-aliases.json');
  if (!fs.existsSync(filePath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed as AliasMap;
  } catch {
    return {};
  }
}

export function saveAliases(aliases: AliasMap, configPath?: string): void {
  const filePath = configPath ?? path.join(process.cwd(), '.stacktrace-aliases.json');
  fs.writeFileSync(filePath, JSON.stringify(aliases, null, 2) + '\n', 'utf-8');
}

export function resolveAlias(filePath: string, aliases: AliasMap): string {
  for (const [alias, target] of Object.entries(aliases)) {
    if (filePath.startsWith(alias)) {
      return filePath.replace(alias, target);
    }
  }
  return filePath;
}

export function addAlias(alias: string, target: string, aliases: AliasMap): AliasMap {
  return { ...aliases, [alias]: target };
}

export function removeAlias(alias: string, aliases: AliasMap): AliasMap {
  const updated = { ...aliases };
  delete updated[alias];
  return updated;
}
