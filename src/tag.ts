import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Tag {
  name: string;
  snapshotIds: string[];
  createdAt: string;
}

export type TagMap = Record<string, Tag>;

export function getTagsPath(): string {
  return path.join(os.homedir(), '.stacktrace-link', 'tags.json');
}

export function loadTags(): TagMap {
  const tagsPath = getTagsPath();
  if (!fs.existsSync(tagsPath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(tagsPath, 'utf8');
    return JSON.parse(raw) as TagMap;
  } catch {
    return {};
  }
}

export function saveTags(tags: TagMap): void {
  const tagsPath = getTagsPath();
  const dir = path.dirname(tagsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(tagsPath, JSON.stringify(tags, null, 2), 'utf8');
}

export function addTag(name: string, snapshotId: string): TagMap {
  const tags = loadTags();
  if (!tags[name]) {
    tags[name] = { name, snapshotIds: [], createdAt: new Date().toISOString() };
  }
  if (!tags[name].snapshotIds.includes(snapshotId)) {
    tags[name].snapshotIds.push(snapshotId);
  }
  saveTags(tags);
  return tags;
}

export function removeTag(name: string, snapshotId?: string): boolean {
  const tags = loadTags();
  if (!tags[name]) return false;
  if (snapshotId) {
    tags[name].snapshotIds = tags[name].snapshotIds.filter(id => id !== snapshotId);
    if (tags[name].snapshotIds.length === 0) {
      delete tags[name];
    }
  } else {
    delete tags[name];
  }
  saveTags(tags);
  return true;
}

export function getSnapshotsByTag(name: string): string[] {
  const tags = loadTags();
  return tags[name]?.snapshotIds ?? [];
}
