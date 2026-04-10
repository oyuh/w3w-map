import { rmSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const nextDir = path.join(process.cwd(), ".next");

try {
  rmSync(nextDir, { recursive: true, force: true });
} catch (error) {
  console.warn("Failed to clear .next before starting dev server:", error);
}

const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, "dev"], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
