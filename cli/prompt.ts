import inquirer from "inquirer";
import type { BaseTemplate, WrapperManifest } from "./types.js";

export async function pickBase(bases: BaseTemplate[]): Promise<string> {
  const { chosen } = await inquirer.prompt([
    {
      type: "list",
      name: "chosen",
      message: "Pick your base template:",
      choices: bases.map((b) => ({
        name: `${b.label}`,
        value: b.name,
      })),
    },
  ]);
  return chosen;
}

export async function pickWrappers(
  wrappers: WrapperManifest[],
  target: string,
  conflicts: string[] = []
): Promise<string[]> {
  const choices = wrappers.map((w) => {
    const isTargetMatch = w.targets.includes(target);
    const isConflicted = conflicts.includes(w.tag);
    return {
      name: `${w.label}${!isTargetMatch ? " (not compatible with this base)" : ""}${isConflicted ? " (conflict detected)" : ""}`,
      value: w.tag,
      disabled: !isTargetMatch || isConflicted ? true : false,
    };
  });

  const { selected } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selected",
      message: "Pick your wrappers: (space to select)",
      choices,
      validate: (answer: string[]) => {
        if (answer.length === 0) return "Select at least one wrapper, or press Ctrl+C to cancel.";
        return true;
      },
    },
  ]);
  return selected;
}

export async function askProjectName(): Promise<string> {
  const { name } = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "Project name:",
      validate: (input: string) =>
        /^[a-zA-Z0-9-_]+$/.test(input) || "Use only letters, numbers, - and _",
    },
  ]);
  return name;
}

export async function askInstallConfirmation(command: string): Promise<boolean> {
  const { run } = await inquirer.prompt([
    {
      type: "confirm",
      name: "run",
      message: `Run install now?\n  ${command}`,
      default: true,
    },
  ]);
  return run;
}

export async function askRootFileAction(
  filename: string,
  filepath: string
): Promise<"overwrite" | "skip" | "merge"> {
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: `Root file conflict: ${filename} already exists at ${filepath}:`,
      choices: [
        { name: "Overwrite", value: "overwrite" },
        { name: "Skip (keep existing)", value: "skip" },
        { name: "Merge (add new keys)", value: "merge" },
      ],
    },
  ]);
  return action;
}
