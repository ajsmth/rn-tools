import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";

const ROOT_DIR = process.cwd();
const PACKAGES_DIR = join(ROOT_DIR, "packages");
const SKIP_DIRS = new Set(["tailwind"]);
const TEST_FILE_REGEX = /\.(test|spec)\.[cm]?[tj]sx?$/;
const ANY_CODE_FILE_REGEX = /\.[cm]?[tj]sx?$/;
const WATCH = process.argv.includes("--watch");

async function hasTestFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules") {
      continue;
    }

    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (await hasTestFiles(fullPath)) {
        return true;
      }
      continue;
    }

    if (TEST_FILE_REGEX.test(entry.name)) {
      return true;
    }

    const normalized = fullPath.split("\\").join("/");
    if (normalized.includes("/__tests__/") && ANY_CODE_FILE_REGEX.test(entry.name)) {
      return true;
    }
  }

  return false;
}

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("exit", (code, signal) => resolve({ code, signal }));
  });
}

async function main() {
  const entries = await readdir(PACKAGES_DIR, { withFileTypes: true });
  const targets = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (SKIP_DIRS.has(entry.name)) {
      continue;
    }

    const packageDir = join(PACKAGES_DIR, entry.name);
    const packageJsonPath = join(packageDir, "package.json");
    let pkg;

    try {
      pkg = JSON.parse(await readFile(packageJsonPath, "utf8"));
    } catch {
      continue;
    }

    if (!pkg?.scripts?.test) {
      continue;
    }

    if (!(await hasTestFiles(packageDir))) {
      continue;
    }

    targets.push({ dir: entry.name, name: pkg.name ?? entry.name });
  }

  if (targets.length === 0) {
    console.log("No package tests found.");
    return;
  }

  if (WATCH) {
    console.log(`\nStarting watch mode for: ${targets.map((t) => t.name).join(", ")}\n`);

    const children = targets.map((target) =>
      spawn("yarn", ["workspace", target.name, "test", "--watch"], {
        cwd: ROOT_DIR,
        stdio: "inherit",
        env: { ...process.env },
      })
    );

    const cleanup = () => children.forEach((child) => child.kill("SIGINT"));
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

    await Promise.all(
      children.map(
        (child) =>
          new Promise((resolve) => {
            child.on("exit", (code) => {
              if (typeof code === "number" && code !== 0) {
                process.exitCode = code;
              }
              resolve();
            });
          })
      )
    );
    return;
  }

  for (const target of targets) {
    console.log(`\nRunning tests for ${target.name}...`);
    const result = await run("yarn", ["workspace", target.name, "test"], {
      cwd: ROOT_DIR,
      env: { ...process.env, CI: "1" },
    });

    if (result.signal) {
      process.exitCode = 1;
      return;
    }

    if (typeof result.code === "number" && result.code !== 0) {
      process.exitCode = result.code;
      return;
    }
  }
}

await main();
