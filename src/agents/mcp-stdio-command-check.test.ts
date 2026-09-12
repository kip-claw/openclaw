import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { stdioCommandExists } from "./mcp-stdio-command-check.js";

describe("stdioCommandExists", () => {
  it("finds a command resolvable on PATH", async () => {
    expect(await stdioCommandExists(process.platform === "win32" ? "cmd" : "sh", undefined, {
      PATH: process.env.PATH ?? "",
    })).toBe(true);
  });

  it("reports a command absent from every PATH entry", async () => {
    const missing = `openclaw-test-missing-command-${randomUUID()}`;
    expect(await stdioCommandExists(missing, undefined, { PATH: process.env.PATH ?? "" })).toBe(
      false,
    );
  });

  it("resolves an absolute path directly without consulting PATH", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "stdio-command-check-"));
    try {
      const scriptPath = path.join(tempDir, "runnable.sh");
      await fs.writeFile(scriptPath, "#!/bin/sh\nexit 0\n");
      await fs.chmod(scriptPath, 0o755);

      expect(await stdioCommandExists(scriptPath, undefined, undefined)).toBe(true);
      expect(await stdioCommandExists(path.join(tempDir, "missing.sh"), undefined, undefined)).toBe(
        false,
      );
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("resolves a relative path against the provided cwd", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "stdio-command-check-cwd-"));
    try {
      const scriptPath = path.join(tempDir, "runnable.sh");
      await fs.writeFile(scriptPath, "#!/bin/sh\nexit 0\n");
      await fs.chmod(scriptPath, 0o755);

      expect(await stdioCommandExists("./runnable.sh", tempDir, undefined)).toBe(true);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
