import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import type { WrapperManifest } from "./types.js";
import { askRootFileAction } from "./prompt.js";

export interface InjectionResult {
  filesCopied: string[];
  rootFilesPlaced: string[];
  rootFilesSkipped: string[];
  errors: string[];
}

export async function injectWrapper(
  wrapper: WrapperManifest,
  projectDir: string,
  repoRoot: string
): Promise<InjectionResult> {
  const result: InjectionResult = {
    filesCopied: [],
    rootFilesPlaced: [],
    rootFilesSkipped: [],
    errors: [],
  };

  const wrapperDir = path.join(repoRoot, "wrappers", `${wrapper.tag}-wrapper`);

  await injectFiles(wrapper, wrapperDir, projectDir, result);
  await injectRootFiles(wrapper, wrapperDir, projectDir, result);

  return result;
}

async function injectFiles(
  _wrapper: WrapperManifest,
  wrapperDir: string,
  projectDir: string,
  result: InjectionResult
): Promise<void> {
  const filesDir = path.join(wrapperDir, "_files");
  const filesExist = await fs.pathExists(filesDir);
  if (!filesExist) return;

  await copyRelative(filesDir, projectDir, result.filesCopied);
}

async function injectRootFiles(
  _wrapper: WrapperManifest,
  wrapperDir: string,
  projectDir: string,
  result: InjectionResult
): Promise<void> {
  const rootDir = path.join(wrapperDir, "_root");
  const rootExist = await fs.pathExists(rootDir);
  if (!rootExist) return;

  const entries = await fs.readdir(rootDir);
  for (const entry of entries) {
    const sourcePath = path.join(rootDir, entry);
    const targetPath = path.join(projectDir, entry);
    const stat = await fs.stat(sourcePath);
    if (stat.isDirectory()) {
      await copyRecursive(sourcePath, targetPath, result.rootFilesPlaced);
    } else {
      await handleRootFile(sourcePath, targetPath, entry, result);
    }
  }
}

async function handleRootFile(
  sourcePath: string,
  targetPath: string,
  filename: string,
  result: InjectionResult
): Promise<void> {
  if (!(await fs.pathExists(targetPath))) {
    await fs.copy(sourcePath, targetPath);
    result.rootFilesPlaced.push(targetPath);
    return;
  }

  try {
    const lockPath = path.join(path.dirname(targetPath), "scaffold.lock");
    const lockContent = await fs.readJson(lockPath);
    const wrapperTag = path.basename(path.dirname(path.dirname(sourcePath)));
    const wrapperRef = lockContent.wrappers?.find(
      (w: any) => w.tag === wrapperTag.replace("-wrapper", "")
    );
    if (wrapperRef) {
      result.rootFilesSkipped.push(`${targetPath} (already from this wrapper)`);
      return;
    }
  } catch {
  }

  const action = await askRootFileAction(filename, targetPath);

  if (action === "overwrite") {
    await fs.copy(sourcePath, targetPath);
    result.rootFilesPlaced.push(`${targetPath} (overwritten)`);
  } else if (action === "merge") {
    await mergeConfigFile(sourcePath, targetPath);
    result.rootFilesPlaced.push(`${targetPath} (merged)`);
  } else {
    result.rootFilesSkipped.push(targetPath);
  }
}

async function copyRelative(
  sourceDir: string,
  targetDir: string,
  placed: string[]
): Promise<void> {
  const entries = await fs.readdir(sourceDir);
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry);
    const targetPath = path.join(targetDir, entry);
    await copyRecursive(sourcePath, targetPath, placed);
  }
}

async function mergeConfigFile(sourcePath: string, targetPath: string): Promise<void> {
  const sourceContent = await fs.readFile(sourcePath, "utf-8");
  const existingContent = await fs.readFile(targetPath, "utf-8");

  const merged = `${existingContent.trimEnd()}\n\n// --- merged from wrapper ---\n${sourceContent}`;
  await fs.writeFile(targetPath, merged);
}

async function copyRecursive(
  source: string,
  target: string,
  placed: string[]
): Promise<void> {
  const stat = await fs.stat(source);
  if (stat.isDirectory()) {
    await fs.ensureDir(target);
    const entries = await fs.readdir(source);
    for (const entry of entries) {
      await copyRecursive(path.join(source, entry), path.join(target, entry), placed);
    }
  } else {
    await fs.ensureDir(path.dirname(target));
    await fs.copy(source, target);
    placed.push(target);
  }
}

export async function copyBaseTemplate(
  baseDir: string,
  projectDir: string
): Promise<void> {
  await fs.copy(baseDir, projectDir, {
    filter: (src) => {
      const basename = path.basename(src);
      return !basename.startsWith(".") || basename === ".gitignore" || basename === ".env.example";
    },
  });
}
