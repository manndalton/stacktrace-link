import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseUnifiedDiff, applyPatch, extractPatchForFrame } from './patch';

const SAMPLE_DIFF = `--- a/foo.ts
+++ b/foo.ts
@@ -1,3 +1,4 @@
 line1
+inserted
 line2
 line3
`;

describe('parseUnifiedDiff', () => {
  it('parses file name', () => {
    const patches = parseUnifiedDiff(SAMPLE_DIFF);
    expect(patches).toHaveLength(1);
    expect(patches[0].file).toBe('foo.ts');
  });

  it('parses hunk start line', () => {
    const patches = parseUnifiedDiff(SAMPLE_DIFF);
    expect(patches[0].hunks[0].startLine).toBe(1);
  });

  it('collects hunk lines', () => {
    const patches = parseUnifiedDiff(SAMPLE_DIFF);
    expect(patches[0].hunks[0].lines).toContain('inserted');
    expect(patches[0].hunks[0].lines).toContain('line1');
  });
});

describe('applyPatch', () => {
  it('writes patched content to file', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'patch-test-'));
    const file = path.join(dir, 'foo.ts');
    fs.writeFileSync(file, 'line1\nline2\nline3\n');
    const patches = parseUnifiedDiff(SAMPLE_DIFF);
    applyPatch(patches[0], dir);
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toContain('inserted');
    fs.rmSync(dir, { recursive: true });
  });
});

describe('extractPatchForFrame', () => {
  it('returns context lines around given line', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'patch-ctx-'));
    const file = path.join(dir, 'src.ts');
    fs.writeFileSync(file, Array.from({ length: 10 }, (_, i) => `line${i + 1}`).join('\n'));
    const result = extractPatchForFrame(file, 5, 1);
    expect(result).toContain('5: line5');
    expect(result).toContain('4: line4');
    expect(result).toContain('6: line6');
    fs.rmSync(dir, { recursive: true });
  });

  it('returns empty string for missing file', () => {
    expect(extractPatchForFrame('/nonexistent/file.ts', 1)).toBe('');
  });
});
