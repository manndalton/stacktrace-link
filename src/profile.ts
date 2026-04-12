import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Profile {
  name: string;
  editor?: string;
  filters?: string[];
  rootDir?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileStore {
  active: string | null;
  profiles: Record<string, Profile>;
}

export function getProfilesPath(): string {
  return path.join(os.homedir(), '.stacktrace-link', 'profiles.json');
}

export function loadProfiles(): ProfileStore {
  const filePath = getProfilesPath();
  if (!fs.existsSync(filePath)) {
    return { active: null, profiles: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as ProfileStore;
  } catch {
    return { active: null, profiles: {} };
  }
}

export function saveProfiles(store: ProfileStore): void {
  const filePath = getProfilesPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf8');
}

export function addProfile(name: string, data: Omit<Profile, 'name' | 'createdAt' | 'updatedAt'>): Profile {
  const store = loadProfiles();
  const now = new Date().toISOString();
  const profile: Profile = { name, ...data, createdAt: now, updatedAt: now };
  store.profiles[name] = profile;
  saveProfiles(store);
  return profile;
}

export function removeProfile(name: string): boolean {
  const store = loadProfiles();
  if (!store.profiles[name]) return false;
  delete store.profiles[name];
  if (store.active === name) store.active = null;
  saveProfiles(store);
  return true;
}

export function setActiveProfile(name: string | null): boolean {
  const store = loadProfiles();
  if (name !== null && !store.profiles[name]) return false;
  store.active = name;
  saveProfiles(store);
  return true;
}

export function getActiveProfile(): Profile | null {
  const store = loadProfiles();
  if (!store.active) return null;
  return store.profiles[store.active] ?? null;
}
