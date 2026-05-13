#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

import type { BaseTemplate, WrapperJson, WrapperManifest } from "./types.js";
import { pickBase, pickWrappers, askProjectName } from "./prompt.js";
import { resolveWrappers } from "./resolver.js";
import { injectWrapper, copyBaseTemplate } from "./injector.js";
import {
  mergePackageJson,
  mergeEnvExample,
  printInstallCommand,
  writeLockFile,
} from "./merger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findRepoRoot(): string {
  const candidates = [
    path.resolve(__dirname, ".."),
    path.resolve(__dirname, "..", ".."),
    path.resolve(__dirname, "..", "..", ".."),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "templates"))) {
      return candidate;
    }
  }
  return path.resolve(__dirname, "..");
}

const REPO_ROOT = findRepoRoot();

function getBases(): BaseTemplate[] {
  const templatesDir = path.join(REPO_ROOT, "templates");
  const entries = fs.readdirSync(templatesDir, { withFileTypes: true });
  const bases: BaseTemplate[] = [];

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith(".")) {
      const label = entry.name
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      bases.push({ name: entry.name, label, dir: entry.name });
    }
  }

  const configPath = path.join(templatesDir, "config.json");
  if (fs.existsSync(configPath)) {
    try {
      const config = fs.readJsonSync(configPath);
      if (config.templates) {
        for (const t of config.templates) {
          const base = bases.find((b) => b.name === t.name);
          if (base) base.label = t.description || base.label;
        }
      }
    } catch {}
  }

  return bases;
}

function getAvailableWrappers(): WrapperManifest[] {
  const wrappersDir = path.join(REPO_ROOT, "wrappers");
  const entries = fs.readdirSync(wrappersDir, { withFileTypes: true });
  const wrappers: WrapperManifest[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const wrapperJsonPath = path.join(wrappersDir, entry.name, "wrapper.json");
    if (!fs.existsSync(wrapperJsonPath)) continue;

    try {
      const json: WrapperJson = fs.readJsonSync(wrapperJsonPath);
      wrappers.push({
        tag: json.tag,
        label: json.label,
        targets: json.targets || [],
        needs: json.needs || [],
        conflicts: json.conflicts || [],
        packages: json.packages || { dependencies: [], devDependencies: [] },
        env_vars: json.env_vars || [],
        version: json.version || "1.0.0",
        filesDir: path.join(wrappersDir, entry.name, "_files"),
        rootDir: path.join(wrappersDir, entry.name, "_root"),
        wrapperJsonPath,
      });
    } catch {}
  }

  return wrappers;
}

const program = new Command();

program
  .name("scaffy-temp")
  .description("Scaffold project templates with composable wrappers")
  .version("1.0.0");

program
  .command("init")
  .description("Create a new project from base template + wrappers")
  .argument("[project-name]", "name of your new project")
  .option("-b, --base <base>", "base template name")
  .option("-w, --wrappers <wrappers...>", "wrapper tags to include")
  .action(async (projectName: string | undefined, options) => {
    try {
      const bases = getBases();
      const allWrappers = getAvailableWrappers();

      if (bases.length === 0) {
        console.log(chalk.red("❌ No base templates found in templates/"));
        process.exit(1);
      }

      const baseName = options.base || (await pickBase(bases));
      const base = bases.find((b) => b.name === baseName);
      if (!base) {
        console.log(chalk.red(`❌ Base template "${baseName}" not found`));
        process.exit(1);
      }

      let wrapperTags = options.wrappers;
      if (!wrapperTags || wrapperTags.length === 0) {
        const alreadySelected: string[] = [];
        wrapperTags = await pickWrappers(allWrappers, baseName, alreadySelected);
      }

      const resolution = resolveWrappers(wrapperTags, allWrappers, baseName);

      if (resolution.errors.length > 0) {
        for (const err of resolution.errors) {
          console.log(chalk.red(`  ✖ ${err}`));
        }
        process.exit(1);
      }

      for (const warn of resolution.warnings) {
        console.log(chalk.yellow(`  ⚠ ${warn}`));
      }

      if (!projectName) {
        projectName = await askProjectName();
      }

      const projectDir = path.resolve(process.cwd(), projectName);
      if (await fs.pathExists(projectDir)) {
        console.log(chalk.red(`❌ Directory ${projectName} already exists.`));
        process.exit(1);
      }

      const baseDir = path.join(REPO_ROOT, "templates", base.dir);
      if (!(await fs.pathExists(baseDir))) {
        console.log(chalk.red(`❌ Base template directory not found: ${baseDir}`));
        process.exit(1);
      }

      console.log(chalk.cyan(`\nScaffolding ${projectName}...\n`));

      await copyBaseTemplate(baseDir, projectDir);
      console.log(chalk.green(`  ✓ Base "${base.label}" copied`));

      for (const wrapper of resolution.selected) {
        const result = await injectWrapper(wrapper, projectDir, REPO_ROOT);
        for (const f of result.filesCopied) {
          console.log(chalk.green(`  ✓ ${wrapper.tag}: ${path.relative(projectDir, f)}`));
        }
        for (const f of result.rootFilesPlaced) {
          console.log(chalk.green(`  ✓ ${wrapper.tag} (root): ${path.relative(projectDir, f)}`));
        }
        for (const f of result.rootFilesSkipped) {
          console.log(chalk.gray(`  - ${wrapper.tag}: ${path.relative(projectDir, f)} (skipped)`));
        }
        for (const e of result.errors) {
          console.log(chalk.red(`  ✖ ${wrapper.tag}: ${e}`));
        }
      }

      await mergePackageJson(projectDir, resolution.selected);
      console.log(chalk.green("  ✓ package.json deps merged"));

      await mergeEnvExample(projectDir, resolution.selected);
      console.log(chalk.green("  ✓ .env.example appended"));

      await writeLockFile(projectDir, baseName, resolution.selected);
      console.log(chalk.green("  ✓ scaffold.lock written"));

      await printInstallCommand(resolution.selected);

      console.log(chalk.yellow("\nNext steps:"));
      console.log(`  cd ${projectName}`);
      console.log("  npm install  (if not done above)");
      console.log("  npm run dev\n");
    } catch (err) {
      console.error(chalk.red("Error:"), err);
      process.exit(1);
    }
  });

program
  .command("add")
  .description("Add wrappers to an existing project")
  .argument("<wrappers...>", "wrapper tags to add")
  .action(async (wrapperTags: string[]) => {
    try {
      const projectDir = process.cwd();
      const allWrappers = getAvailableWrappers();

      let existingTags: string[] = [];
      let baseName = "unknown";
      const lockPath = path.join(projectDir, "scaffold.lock");
      if (await fs.pathExists(lockPath)) {
        const lock = await fs.readJson(lockPath);
        existingTags = lock.wrappers?.map((w: any) => w.tag) || [];
        baseName = lock.base || "unknown";
      }

      const resolution = resolveWrappers(
        [...new Set([...existingTags, ...wrapperTags])],
        allWrappers,
        baseName
      );

      if (resolution.errors.length > 0) {
        for (const err of resolution.errors) {
          console.log(chalk.red(`  ✖ ${err}`));
        }
        process.exit(1);
      }

      for (const warn of resolution.warnings) {
        console.log(chalk.yellow(`  ⚠ ${warn}`));
      }

      const newWrappers = resolution.selected.filter(
        (w) => !existingTags.includes(w.tag)
      );

      if (newWrappers.length === 0) {
        console.log(chalk.yellow("  All selected wrappers are already present. Nothing to do."));
        return;
      }

      console.log(chalk.cyan("\nInjecting wrappers...\n"));

      for (const wrapper of newWrappers) {
        const result = await injectWrapper(wrapper, projectDir, REPO_ROOT);
        for (const f of result.filesCopied) {
          console.log(chalk.green(`  ✓ ${wrapper.tag}: ${path.relative(projectDir, f)}`));
        }
        for (const f of result.rootFilesPlaced) {
          console.log(chalk.green(`  ✓ ${wrapper.tag} (root): ${path.relative(projectDir, f)}`));
        }
        for (const f of result.rootFilesSkipped) {
          console.log(chalk.gray(`  - ${wrapper.tag}: ${path.relative(projectDir, f)} (skipped)`));
        }
      }

      await mergePackageJson(projectDir, newWrappers);
      console.log(chalk.green("  ✓ package.json deps merged"));

      await mergeEnvExample(projectDir, newWrappers);
      console.log(chalk.green("  ✓ .env.example appended"));

      await writeLockFile(projectDir, baseName, resolution.selected);
      console.log(chalk.green("  ✓ scaffold.lock updated"));

      await printInstallCommand(newWrappers);
    } catch (err) {
      console.error(chalk.red("Error:"), err);
      process.exit(1);
    }
  });

program.parse();
