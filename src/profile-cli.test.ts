import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runList, runAdd, runRemove, runShow, runProfileCli } from './profile-cli';
import { getProfilesPath, addProfile, setActiveProfile } from './profile';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'profile-cli-test-'));
const origHome = process.env.HOME;

beforeAll(() => { process.env.HOME = tmpDir; });
afterAll(() => { process.env.HOME = origHome; fs.rmSync(tmpDir, { recursive: true }); });
beforeEach(() => {
  const p = getProfilesPath();
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

describe('runList', () => {
  it('prints message when no profiles', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    runList();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No profiles'));
    spy.mockRestore();
  });

  it('marks active profile with asterisk', () => {
    addProfile('alpha', {});
    setActiveProfile('alpha');
    const spy = jest.spyOn(console, 'log').mockImplementation();
    runList();
    const output = spy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('* alpha');
    spy.mockRestore();
  });
});

describe('runAdd', () => {
  it('adds a profile', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    runAdd(['myprofile', '--editor', 'code']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("'myprofile' added"));
    spy.mockRestore();
  });

  it('exits when name missing', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runAdd([])).toThrow('exit');
    exit.mockRestore();
  });
});

describe('runRemove', () => {
  it('removes existing profile', () => {
    addProfile('bye', {});
    const spy = jest.spyOn(console, 'log').mockImplementation();
    runRemove(['bye']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("'bye' removed"));
    spy.mockRestore();
  });
});

describe('runShow', () => {
  it('prints profile JSON', () => {
    addProfile('show-me', { editor: 'nvim' });
    const spy = jest.spyOn(console, 'log').mockImplementation();
    runShow(['show-me']);
    const output = spy.mock.calls.map(c => c[0]).join('');
    expect(output).toContain('nvim');
    spy.mockRestore();
  });
});

describe('runProfileCli', () => {
  it('dispatches use command', () => {
    addProfile('proj', {});
    const spy = jest.spyOn(console, 'log').mockImplementation();
    runProfileCli(['use', 'proj']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("set to 'proj'"));
    spy.mockRestore();
  });

  it('dispatches clear command', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    runProfileCli(['clear']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('cleared'));
    spy.mockRestore();
  });

  it('shows usage for unknown command', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    runProfileCli(['unknown']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Usage'));
    spy.mockRestore();
  });
});
