import { formatFrame, formatFrameList, formatSummary, FrameDisplay } from "./formatter";
import * as path from "path";

const CWD = "/home/user/project";

const userFrame: FrameDisplay = {
  file: "/home/user/project/src/index.ts",
  line: 10,
  column: 5,
  functionName: "main",
  isUser: true,
};

const nodeFrame: FrameDisplay = {
  file: "/home/user/project/node_modules/express/index.js",
  line: 42,
  column: 1,
  functionName: "Layer.handle",
  isUser: false,
};

describe("formatFrame", () => {
  it("formats a frame with a function name", () => {
    const result = formatFrame(userFrame, CWD);
    expect(result).toBe("main (src/index.ts:10:5)");
  });

  it("formats a frame without a function name", () => {
    const frame = { ...userFrame, functionName: undefined };
    const result = formatFrame(frame, CWD);
    expect(result).toBe("(src/index.ts:10:5)");
  });

  it("uses relative path when file is absolute", () => {
    const result = formatFrame(userFrame, CWD);
    expect(result).not.toContain("/home/user/project/");
  });
});

describe("formatFrameList", () => {
  it("returns only user frames by default", () => {
    const result = formatFrameList([userFrame, nodeFrame], { cwd: CWD });
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("src/index.ts");
  });

  it("returns all frames when showAll is true", () => {
    const result = formatFrameList([userFrame, nodeFrame], { showAll: true, cwd: CWD });
    expect(result).toHaveLength(2);
  });
});

describe("formatSummary", () => {
  it("returns summary with first user frame", () => {
    const result = formatSummary([nodeFrame, userFrame], CWD);
    expect(result).toMatch(/^Opening /);
    expect(result).toContain("src/index.ts");
  });

  it("returns fallback message when no user frames exist", () => {
    const result = formatSummary([nodeFrame], CWD);
    expect(result).toBe("No user frames found in stack trace.");
  });
});
