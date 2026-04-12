import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getProfilesPath, loadProfiles, saveProfiles,
  addProfile, removeProfile, setActiveProfile, getActiveProfile,
} from './profile';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'profile-test-'));
const origHome = process.env.HOME;

beforeAll(() => { process.env.HOME = tmpDir; });
afterAll(() => { process.env.HOME = origHome; fs.rmSync(tmpDir, { recursive: true }); });
beforeEach(() => {
  const p = getProfilesPath();
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

describe('loadProfiles', () => {
  it('returns empty store when file missing', () => {
    const store = loadProfiles();
    expect(store.active).toBeNull();
    expect(store.profiles).toEqual({});
  });

  it('returns empty store on corrupt file', () => {
    const p = getProfilesPath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, 'not-json');
    expect(loadProfiles().profiles).toEqual({});
  });
});

describe('addProfile', () => {
  it('adds a profile and persists it', () => {
    const profile = addProfile('work', { editor: 'code', rootDir: '/projects' });
    expect(profile.name).toBe('work');
    expect(profile.editor).toBe('code');
    const store = loadProfiles();
    expect(store.profiles['work']).toBeDefined();
  });

  it('sets createdAt and updatedAt', () => {
    const profile = addProfile('test', {});
    expect(profile.createdAt).toBeTruthy();
    expect(profile.updatedAt).toBeTruthy();
  });
});

describe('removeProfile', () => {
  it('removes an existing profile', () => {
    addProfile('tmp', {});
    expect(removeProfile('tmp')).toBe(true);
    expect(loadProfiles().profiles['tmp']).toBeUndefined();
  });

  it('returns false for unknown profile', () => {
    expect(removeProfile('ghost')).toBe(false);
  });

  it('clears active if removed profile was active', () => {
    addProfile('active-one', {});
    setActiveProfile('active-one');
    removeProfile('active-one');
    expect(loadProfiles().active).toBeNull();
  });
});

describe('setActiveProfile / getActiveProfile', () => {
  it('sets and gets active profile', () => {
    addProfile('main', { editor: 'vim' });
    expect(setActiveProfile('main')).toBe(true);
    const active = getActiveProfile();
    expect(active?.name).toBe('main');
  });

  it('returns false for unknown profile', () => {
    expect(setActiveProfile('nope')).toBe(false);
  });

  it('allows clearing active with null', () => {
    addProfile('p', {});
    setActiveProfile('p');
    setActiveProfile(null);
    expect(getActiveProfile()).toBeNull();
  });
});
