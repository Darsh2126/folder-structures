#!/usr/bin/env node
import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import degit from "degit";
import path from "path";
import fetch from "node-fetch";
import fs from "fs";

const program = new Command();

// Fetch templates list from repo config.json
async function getTemplatesFromRepo() {
  const url =
    "https://raw.githubusercontent.com/Darsh2126/folder-structures/main/templates/config.json";

  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.templates;
  } catch (err) {
    console.log(
      chalk.red("⚠ Failed to fetch templates list. Using fallback.")
    );
    return [
      {
        name: "fullstack-next",
        description: "Next.js + TypeScript fullstack app",
      },
      { name: "node-auth-basic", description: "Express + JWT auth starter" },
    ];
  }
}

program
  .name("scaffy-temp")
  .description("Scaffold project templates from GitHub")
  .version("0.1.0");

program
  .argument("[project-name]", "name of your new project")
  .option("-t, --template <template>", "template name (e.g. fullstack-next)")
  .action(async (projectName: string | undefined, options) => {
    const templates = await getTemplatesFromRepo();

    let template = options.template;

    // Ask for template if not passed
    if (!template) {
      const { chosen } = await inquirer.prompt([
        {
          type: "list",
          name: "chosen",
          message: "Choose a template:",
          choices: templates.map((t: any) => ({
            name: `${t.name} - ${t.description}`,
            value: t.name,
          })),
        },
      ]);
      template = chosen;
    }

    // Ask for project name if not passed
    if (!projectName) {
      const { name } = await inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "Project name:",
          validate: (input: string) =>
            /^[a-zA-Z0-9-_]+$/.test(input) ||
            "Use only letters, numbers, - and _",
        },
      ]);
      projectName = name;
    }

    const targetDir = path.resolve(process.cwd(), String(projectName));

    if (fs.existsSync(targetDir)) {
      console.log(chalk.red(`❌ Directory ${projectName} already exists.`));
      process.exit(1);
    }

    const spinner = ora(`Fetching template ${template}...`).start();

    try {
      const emitter = degit(
        `Darsh2126/folder-structures/templates/${template}`,
        {
          cache: false,
          force: true,
        }
      );

      await emitter.clone(targetDir);

      spinner.succeed(`✅ Project created at ${chalk.green(targetDir)}`);
      console.log(chalk.yellow("\nNext steps:"));
      console.log(`  cd ${projectName}`);
      console.log("  npm install");
      console.log("  npm run dev\n");
    } catch (err) {
      spinner.fail("❌ Failed to download template");
      console.error(err);
      process.exit(1);
    }
  });

program.parse();
