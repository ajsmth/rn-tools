import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const ROOT_DIR = process.cwd();
const PACKAGES_DIR = join(ROOT_DIR, "packages");
const PACKAGE_DIRS = ["core", "sheets", "navigation"];

const dryRun = process.argv.includes("--dry-run");

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("exit", (code, signal) => resolve({ code, signal }));
  });
}

async function main() {
  for (const dir of PACKAGE_DIRS) {
    const packageDir = join(PACKAGES_DIR, dir);
    const pkg = JSON.parse(await readFile(join(packageDir, "package.json"), "utf8"));
    const name = pkg.name ?? dir;
    const version = pkg.version ?? "unknown";

    const args = ["publish", "--access", "public"];
    if (dryRun) args.push("--dry-run");

    console.log(`\nPublishing ${name}@${version}${dryRun ? " (dry-run)" : ""}...`);
    const result = await run("npm", args, { cwd: packageDir });

    if (result.signal) {
      console.error(`Publishing ${name} was killed by signal ${result.signal}`);
      process.exitCode = 1;
      return;
    }

    if (typeof result.code === "number" && result.code !== 0) {
      console.error(`Publishing ${name} failed with exit code ${result.code}`);
      process.exitCode = result.code;
      return;
    }

    console.log(`Published ${name}@${version} successfully.`);
  }
}

await main();
