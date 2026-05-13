import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import type { WrapperManifest } from "./types.js";
import { askInstallConfirmation } from "./prompt.js";

export async function mergePackageJson(
  projectDir: string,
  wrappers: WrapperManifest[]
): Promise<void> {
  const pkgPath = path.join(projectDir, "package.json");
  const pkg = await fs.readJson(pkgPath);

  for (const wrapper of wrappers) {
    for (const dep of wrapper.packages.dependencies) {
      if (!pkg.dependencies?.[dep]) {
        pkg.dependencies = pkg.dependencies || {};
        pkg.dependencies[dep] = "latest";
      }
    }
    for (const devDep of wrapper.packages.devDependencies) {
      if (!pkg.devDependencies?.[devDep]) {
        pkg.devDependencies = pkg.devDependencies || {};
        pkg.devDependencies[devDep] = "latest";
      }
    }
  }

  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}

export async function mergeEnvExample(
  projectDir: string,
  wrappers: WrapperManifest[]
): Promise<void> {
  const envPath = path.join(projectDir, ".env.example");
  let existing: string[] = [];

  if (await fs.pathExists(envPath)) {
    const content = await fs.readFile(envPath, "utf-8");
    existing = content.split("\n").filter((l) => l.startsWith("DATABASE_URL") || l.startsWith("NEXTAUTH_") || l.startsWith("REDIS_") || l.startsWith("AUTH_"));
  }

  const lines: string[] = [];

  for (const wrapper of wrappers) {
    const hasNew = wrapper.env_vars.some((v) => {
      const key = v.split("=")[0];
      return !existing.some((e) => e.startsWith(key));
    });
    if (!hasNew) continue;

    lines.push(`\n# --- ${wrapper.tag}-wrapper ---`);
    for (const envVar of wrapper.env_vars) {
      const key = envVar.split("=")[0];
      if (!existing.some((e) => e.startsWith(key))) {
        lines.push(envVar);
      }
    }
  }

  if (lines.length > 0) {
    await fs.appendFile(envPath, lines.join("\n"));
  }
}

export async function printInstallCommand(
  wrappers: WrapperManifest[]
): Promise<void> {
  const allDeps = new Set<string>();
  const allDevDeps = new Set<string>();

  for (const w of wrappers) {
    for (const d of w.packages.dependencies) allDeps.add(d);
    for (const d of w.packages.devDependencies) allDevDeps.add(d);
  }

  if (allDeps.size === 0 && allDevDeps.size === 0) {
    console.log(chalk.gray("  No additional packages needed."));
    return;
  }

  const depList = Array.from(allDeps);
  const devDepList = Array.from(allDevDeps);

  console.log(chalk.yellow("\nThe following packages need to be installed:"));
  for (const d of depList) console.log(`  + ${d}`);
  for (const d of devDepList) console.log(`  + ${d} (dev)`);

  let command = "";
  if (depList.length > 0) {
    command = `npm install ${depList.join(" ")}`;
  }
  if (devDepList.length > 0) {
    const installCmd = `npm install -D ${devDepList.join(" ")}`;
    command = command ? `${command} && ${installCmd}` : installCmd;
  }

  const shouldInstall = await askInstallConfirmation(command);
  if (shouldInstall) {
    const { execSync } = await import("child_process");
    try {
      execSync(command, { cwd: process.cwd(), stdio: "inherit" });
      console.log(chalk.green("  Packages installed ✓"));
    } catch {
      console.log(chalk.red("  Package installation failed. Run manually:"));
      console.log(chalk.yellow(`  ${command}`));
    }
  } else {
    console.log(chalk.yellow(`  Run manually:\n  ${command}`));
  }
}

export async function writeLockFile(
  projectDir: string,
  base: string,
  wrappers: WrapperManifest[]
): Promise<void> {
  const lock = {
    base,
    wrappers: wrappers.map((w) => ({
      tag: w.tag,
      version: w.version,
    })),
    scaffoldedAt: new Date().toISOString(),
  };

  await fs.writeJson(path.join(projectDir, "scaffold.lock"), lock, { spaces: 2 });
}
