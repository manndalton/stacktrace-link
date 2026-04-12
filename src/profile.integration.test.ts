import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { addProfile, setActiveProfile, getActiveProfile, removeProfile, loadProfiles } from './profile';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'profile-int-'));
const origHome = process.env.HOME;

beforeAll(() => { process.env.HOME = tmpDir; });
afterAll(() => { process.env.HOME = origHome; fs.rmSync(tmpDir, { recursive: true }); });

describe('profile lifecycle', () => {
  it('full add → activate → deactivate → remove flow', () => {
    addProfile('dev', { editor: 'code', rootDir: '/dev', filters: ['src/**'] });
    addProfile('prod', { editor: 'vim' });

    expect(Object.keys(loadProfiles().profiles)).toHaveLength(2);

    setActiveProfile('dev');
    let active = getActiveProfile();
    expect(active?.name).toBe('dev');
    expect(active?.editor).toBe('code');
    expect(active?.filters).toContain('src/**');

    setActiveProfile('prod');
    expect(getActiveProfile()?.name).toBe('prod');

    removeProfile('dev');
    expect(loadProfiles().profiles['dev']).toBeUndefined();
    expect(getActiveProfile()?.name).toBe('prod');

    removeProfile('prod');
    expect(getActiveProfile()).toBeNull();
    expect(Object.keys(loadProfiles().profiles)).toHaveLength(0);
  });

  it('removing active profile clears active', () => {
    addProfile('temp', {});
    setActiveProfile('temp');
    removeProfile('temp');
    expect(loadProfiles().active).toBeNull();
  });

  it('setActiveProfile returns false for non-existent profile', () => {
    expect(setActiveProfile('ghost')).toBe(false);
    expect(loadProfiles().active).toBeNull();
  });
});
