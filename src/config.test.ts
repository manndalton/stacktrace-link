import * as fs from 'fs';
import * as path from 'path';
import { findConfigFile, loadConfig } from './config';

jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('findConfigFile', () => {
  beforeEach(() => {
    mockedFs.existsSync.mockReturnValue(false);
  });

  it('returns null when no config file exists', () => {
    const result = findConfigFile('/some/deep/project/src');
    expect(result).toBeNull();
  });

  it('finds .stacktrace-link.json in the start directory', () => {
    mockedFs.existsSync.mockImplementation((p) =>
      p === '/project/.stacktrace-link.json'
    );
    const result = findConfigFile('/project');
    expect(result).toBe('/project/.stacktrace-link.json');
  });

  it('finds config in a parent directory', () => {
    mockedFs.existsSync.mockImplementation((p) =>
      p === '/project/.stacktrace-linkrc'
    );
    const result = findConfigFile('/project/src/utils');
    expect(result).toBe('/project/.stacktrace-linkrc');
  });
});

describe('loadConfig', () => {
  beforeEach(() => {
    mockedFs.existsSync.mockReturnValue(false);
  });

  it('returns defaults when no config file is found', () => {
    const config = loadConfig('/no/config/here');
    expect(config).toMatchObject({
      showAllFrames: false,
    });
    expect(typeof config.editor).toBe('string');
    expect(typeof config.projectRoot).toBe('string');
  });

  it('merges config file values with defaults', () => {
    mockedFs.existsSync.mockImplementation((p) =>
      p === '/project/.stacktrace-link.json'
    );
    mockedFs.readFileSync.mockReturnValue(
      JSON.stringify({ editor: 'vim', showAllFrames: true })
    );
    const config = loadConfig('/project');
    expect(config.editor).toBe('vim');
    expect(config.showAllFrames).toBe(true);
    expect(typeof config.projectRoot).toBe('string');
  });

  it('falls back to defaults if config JSON is invalid', () => {
    mockedFs.existsSync.mockImplementation((p) =>
      p === '/project/.stacktrace-link.json'
    );
    mockedFs.readFileSync.mockReturnValue('not valid json{{');
    const config = loadConfig('/project');
    expect(config.showAllFrames).toBe(false);
  });
});
