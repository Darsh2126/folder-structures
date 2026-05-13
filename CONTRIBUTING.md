# Contributing — Adding a New Wrapper

This guide walks you through adding a new library/integration wrapper. Follow these steps in order for every new wrapper.

---

## Quick Reference — Which Files to Create

```
wrappers/<tag>-wrapper/
  _files/src/wrappers/<tag>/    ← code files (required)
    index.ts
    ...
  _root/                        ← root config files (optional)
    <config-file>
  wrapper.json                  ← metadata (required)
  README.md                     ← "wire it up" guide (required)
```

---

## Step-by-Step

### 1. Pick a Short Tag Name

The tag is the identifier used everywhere. It becomes the folder name and the CLI argument.

| Tag | Good? | Why |
|---|---|---|
| `drizzle` | ✅ | Short, recognizable |
| `react-hook-form` | ❌ | Too long. Use `rhf` instead |
| `auth` | ✅ | Perfect |
| `my-awesome-lib` | ❌ | Not clear. Match the library name |

**Rule:** Max 8 characters, kebab-case, no numbers.

---

### 2. Create the Wrapper Directory

```
mkdir -p wrappers/<tag>-wrapper/_files/src/wrappers/<tag>
```

If your wrapper also needs files at the project root:

```
mkdir -p wrappers/<tag>-wrapper/_root
```

---

### 3. Create `wrapper.json`

This is the **most important file**. Every field matters.

```json
{
  "tag": "<tag>",
  "label": "<Human-readable name>",
  "targets": ["which-base-templates-this-works-with"],
  "needs": ["other-wrappers-this-depends-on"],
  "conflicts": ["wrappers-that-cannot-coexist"],
  "packages": {
    "dependencies": ["npm-packages"],
    "devDependencies": ["dev-only-npm-packages"]
  },
  "env_vars": ["ENV_VAR=default_value"],
  "version": "1.0.0"
}
```

#### Field-by-field Rules

| Field | Required | Rules |
|---|---|---|
| `tag` | ✅ | Must match the folder name (after `-wrapper`). Lowercase, kebab-case. |
| `label` | ✅ | Displayed in CLI prompts. Max 40 chars, human-readable. |
| `targets` | ✅ | Array of base template names this wrapper supports. Use `"*"` for all bases. |
| `needs` | ✅ | Array of tags this wrapper depends on. CLI auto-adds missing ones. Leave `[]` if none. |
| `conflicts` | ✅ | Array of tags that cannot be used alongside this wrapper. Leave `[]` if none. |
| `packages` | ✅ | Object with `dependencies` and `devDependencies` arrays. Use `[]` for empty. |
| `env_vars` | ✅ | Array of env var declarations with defaults. Use `[]` if none. |
| `version` | ✅ | Semver string. Start at `"1.0.0"`. |

#### Valid `targets` Values

| Target | When to use |
|---|---|
| `"nextjs-app-router"` | Works with Next.js App Router base |
| `"nextjs-pages-router"` | Works with Next.js Pages Router base |
| `"react-vite"` | Works with Vite + React base |
| `"node-express"` | Works with Express base |
| `"node-nestjs"` | Works with NestJS base |
| `"*"` | Works with ALL base templates |

#### Examples of `needs` and `conflicts`

```json
// Drizzle needs Zod for schema validation
{ "needs": ["zod"] }

// Prisma conflicts with Drizzle (both are ORMs)
{ "conflicts": ["drizzle"] }

// Auth depends on Zod, can't be used alongside a hypothetical "old-auth"
{ "needs": ["zod"], "conflicts": ["old-auth"] }
```

---

### 4. Create Code Files in `_files/`

The `_files/` directory **mirrors the exact file structure** you want in the user's project.

#### Path Convention

```
_files/
  src/
    wrappers/<tag>/
      index.ts          ← barrel export (ALWAYS include this)
      client.ts         ← connection/initialization
      config.ts         ← configuration
      types.ts          ← TypeScript types
      schema.ts         ← data schema definitions
      components/       ← React components
      hooks/            ← React hooks
```

**Rule:** Every wrapper MUST have `_files/src/wrappers/<tag>/index.ts` as the barrel export.

#### `index.ts` Convention

```typescript
// Always use named exports. No default exports.
export { client } from "./client.js";
export type { Config } from "./types.js";
```

**Why named exports?** Tree-shaking, consistent import patterns across all wrappers:

```typescript
import { db } from "@/wrappers/drizzle";     // ✅ consistent
import DrizzleClient from "@/something/db";   // ❌ inconsistent
```

#### Import Path Rule

All internal imports between files within the same wrapper MUST use **relative paths with `.js` extension**:

```typescript
// Inside _files/src/wrappers/drizzle/index.ts:
export { db } from "./client.js";   // ✅ correct
export { db } from "./client";      // ❌ wrong — will break in ESM
```

---

### 5. Create `_root/` Files (Only If Needed)

Some libraries need a configuration file at the project root. Place those in `_root/`.

| File | Wrapper | Why root? |
|---|---|---|
| `drizzle.config.ts` | drizzle | Drizzle CLI expects it at root |
| `auth.config.ts` | auth | NextAuth route handler imports from root |
| `prisma/schema.prisma` | prisma | Prisma CLI expects it at root |
| `next.config.ts` | nextjs | Next.js config is always at root |

**Rule:** If the library's CLI tool or framework expects a file at project root, put it in `_root/`. If it's application code, put it in `_files/`.

#### Collision Behaviour

| Scenario | What happens |
|---|---|
| File doesn't exist in project | Copied silently |
| File exists, from same wrapper | Skipped silently (idempotent) |
| File exists, from different source | CLI prompts: overwrite / skip / merge |

You don't need to write any collision-handling code — the CLI handles it automatically.

---

### 6. Create `README.md`

Every wrapper needs a "Wire it up" guide showing how to use the generated code.

```markdown
## Wire it up

1. Make sure YOUR_ENV_VAR is set in your .env file.

2. Import and use:
   ```ts
   import { something } from "@/wrappers/<tag>";
   ```

3. Add the provider (if applicable):
   ```tsx
   import { Provider } from "@/wrappers/<tag>";
   ```

## What's inside
- file1.ts → what it does
- file2.ts → what it does
- index.ts → barrel export

## Root files placed
- filename.ext → where it goes and why
```

---

## I Just Want to Copy-Paste — Show Me Examples

### Simplest Wrapper (No Dependencies, No Root Files)

Reference: `wrappers/zod-wrapper/`

```
wrappers/zod-wrapper/
  _files/src/wrappers/zod/
    index.ts          ← named exports
    schemas.ts        ← reusable schemas
    types.ts          ← utility types
  wrapper.json        ← needs: [], root_files: []
  README.md
```

**When to use:** Library requires no other wrapper, has no root config file.

### Wrapper with Root Config File

Reference: `wrappers/drizzle-wrapper/`

```
wrappers/drizzle-wrapper/
  _files/src/wrappers/drizzle/
    index.ts
    client.ts
    schema.ts
  _root/
    drizzle.config.ts
  wrapper.json          ← needs: ["zod"], root_files: ["drizzle.config.ts"]
  README.md
```

**When to use:** Library needs a config at project root (e.g., ORMs, build tools).

### Wrapper with Dependencies

Reference: `wrappers/rhf-wrapper/`

```
wrappers/rhf-wrapper/
  _files/src/wrappers/rhf/
    index.ts
    useFormWrapper.ts
    FormField.tsx
    types.ts
  wrapper.json          ← needs: ["zod"], root_files: []
  README.md
```

**When to use:** Library depends on another wrapper (RHF needs Zod for schema validation).

### Wrapper with Dependencies + Root Config

Reference: `wrappers/auth-wrapper/`

```
wrappers/auth-wrapper/
  _files/src/wrappers/auth/
    index.tsx
    provider.tsx
    config.ts
    types.ts
  _root/
    auth.config.ts
  wrapper.json          ← needs: ["zod"], root_files: ["auth.config.ts"]
  README.md
```

**When to use:** Library depends on another wrapper AND needs a root config file.

---

## Checklist — Before Submitting a New Wrapper

- [ ] `wrappers/<tag>-wrapper/wrapper.json` exists and is valid JSON
- [ ] `tag` field matches the folder name (after `-wrapper`)
- [ ] `targets` lists all compatible base templates (or `"*"`)
- [ ] `needs` lists all wrapper dependencies (or `[]`)
- [ ] `conflicts` lists all incompatible wrappers (or `[]`)
- [ ] `packages` lists all npm dependencies and devDependencies
- [ ] `env_vars` lists all required environment variables (or `[]`)
- [ ] `_files/src/wrappers/<tag>/index.ts` exists and uses **named exports**
- [ ] Internal imports use relative paths with `.js` extension
- [ ] `README.md` has a "Wire it up" section
- [ ] Root config exists in `_root/` only if necessary
- [ ] No `.env`, no secrets, no `node_modules` anywhere in the wrapper
- [ ] Run `npm run build` in the project root — no errors

---

## Adding a New Base Template

Occasionally you'll add a new base template (not just a wrapper). Steps:

1. Create `templates/<new-base>/` with the bare framework scaffold
2. Register it in `templates/config.json`:
   ```json
   { "name": "new-base", "description": "Description" }
   ```
3. Update each wrapper's `targets` if the new base is compatible
4. No CLI changes needed — `getBases()` auto-discovers directories

---

## Testing Your Wrapper Locally

After creating a wrapper, you must test it before use. Here's the exact workflow:

### 1. Build the CLI

From the repo root:

```bash
npm run build
```

This compiles TypeScript from `cli/` and `src/` into `dist/`. Fix any compilation errors before proceeding.

### 2. Quick Smoke Test — Help Output

```bash
node dist/src/cli.js --help
node dist/src/cli.js init --help
node dist/src/cli.js add --help
```

If these work, the CLI is running. Check that your wrapper tag appears when running `init`.

### 3. Test `init` — Non-Interactive Mode

Use the `-b` (base) and `-w` (wrappers) flags to skip prompts. Test in `/tmp` to avoid clutter:

```bash
cd /tmp

# Test with one wrapper
node <repo-root>/dist/src/cli.js test-project \
  -b nextjs-app-router \
  -w <your-tag>

# Test with multiple wrappers (including dependency resolution)
node <repo-root>/dist/src/cli.js test-project \
  -b react-vite \
  -w <your-tag> zod

# Test with all wrappers together (checks for conflicts)
node <repo-root>/dist/src/cli.js test-project \
  -b nextjs-app-router \
  -w zod drizzle <your-tag>
```

**Note:** Replace `<repo-root>` with the actual path to your local clone.

### 4. Verify the Generated Project

```bash
# List all created files (excluding node_modules)
find test-project -not -path '*/node_modules/*' -not -name '.DS_Store' | sort

# Check that wrapper files landed in the right place
ls -la test-project/src/wrappers/<your-tag>/

# If your wrapper has root files, check those too
ls -la test-project/<root-file>

# Verify package.json has the right deps
cat test-project/package.json

# Verify .env.example has your env vars
cat test-project/.env.example

# Verify scaffold.lock recorded everything
cat test-project/scaffold.lock
```

### 5. Verify File Paths Are Correct

The most common bug is doubled paths (e.g., `src/wrappers/zod/src/wrappers/zod/`). Check that each file landed exactly where it should:

```bash
# Expected: src/wrappers/<tag>/file.ts
# If you see src/wrappers/<tag>/src/wrappers/<tag>/file.ts → BUG
```

If paths are doubled, your `_files/` structure is wrong. Fix it:

```
# ❌ WRONG — _files/ already contains src/wrappers/<tag>/file.ts directly,
#    so copying _files/ contents to project root creates a double path
_files/src/wrappers/<tag>/file.ts

# ✅ CORRECT — same structure, but the injector copies _files/ contents
#    relative to project root, so src/wrappers/<tag>/file.ts is the final path
_files/src/wrappers/<tag>/file.ts
```

The structure is correct — the bug would be in the injector if it added an extra prefix. If you see doubled paths, you likely have an extra nesting level in `_files/` or the injector has a bug.

### 6. Test the `add` Command

Test adding a wrapper to an existing project (simulates the mid-project use case):

```bash
cd /tmp

# Create a project first
node <repo-root>/dist/src/cli.js test-project \
  -b nextjs-app-router \
  -w zod

# Now add your new wrapper
cd test-project
node <repo-root>/dist/src/cli.js add <your-tag>
```

The CLI should:
- Read the existing `scaffold.lock`
- Only inject your new wrapper (not re-copy zod)
- Update `package.json` with new deps (without removing existing ones)
- Update `scaffold.lock` with the new wrapper

### 7. Test Interactive Mode

Run the CLI without `-b` or `-w` flags to test the interactive prompts:

```bash
cd /tmp
node <repo-root>/dist/src/cli.js init my-interactive-test
```

Verify:
- Your wrapper appears in the wrapper selection list (greyed out if incompatible with the selected base)
- Selecting it works
- Dependencies are auto-resolved
- Root file collision prompts work (if applicable)
- Package install prompt appears

### 8. Batch Test — Run Init Across All Bases + Wrappers

Test that your wrapper works with every compatible base:

```bash
cd /tmp

for base in nextjs-app-router react-vite node-express; do
  echo "=== Testing $base with <your-tag> ==="
  node <repo-root>/dist/src/cli.js test-$base-$tag \
    -b $base \
    -w <your-tag> 2>&1 | tail -5
  rm -rf test-$base-$tag
done
```

### 9. Test Conflict Resolution (If Applicable)

If your wrapper declares `conflicts`:

```bash
cd /tmp

# This should FAIL with a conflict error
node <repo-root>/dist/src/cli.js test-conflict \
  -b nextjs-app-router \
  -w prisma drizzle
# Expected: ✖ "prisma" conflicts with "drizzle"
```

### 10. Clean Up Test Projects

```bash
rm -rf /tmp/test-*
```

---

## Debugging Common Test Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| `Error: Cannot find module` | Build didn't run, or import path is wrong | Run `npm run build`, check `.js` extensions in imports |
| `Wrapper "X" not found` | `wrapper.json` has wrong tag, or wrapper dir not in `wrappers/` | Check `tag` field matches folder name |
| Files land at wrong path | `_files/` structure doesn't mirror project layout | Files inside `_files/` should start with `src/wrappers/<tag>/` |
| Key doesn't appear in prompt | `targets` doesn't include the selected base | Add the base name to `targets` array |
| Dependencies not installed | `packages` field is missing or empty | Add deps to `wrapper.json` |
| Root file prompt appears unexpectedly | `scaffold.lock` missing or corrupted | Re-init the project |
| TypeScript build errors in wrapper code | Wrapper code has type errors | Fix the TS errors, run `npm run build` |
| Conflict not detected | Tags in `conflicts` array don't match actual tag names | Use exact tag values from other wrappers' `wrapper.json` |

| Mistake | Fix |
|---|---|
| `_files/` path is `src/wrappers/<tag>/file.ts` but without `src/` prefix | Always include `src/` inside `_files/` — it mirrors the project structure |
| `wrapper.json` has `"targets": ["nextjs"]` but base is `"nextjs-app-router"` | Use exact base names as listed in `templates/config.json` |
| Using default exports in `index.ts` | Use named exports only |
| Importing without `.js` extension | Add `.js` extension to all relative imports |
| Putting application code in `_root/` | `_root/` is ONLY for files that MUST be at the project root (config files, CLI tool expectations) |
| Forgetting to run `npm run build` | Always build to verify TypeScript compilation |
| Adding `node_modules` or secrets to the wrapper | Never — wrappers are source code only |

---

## Linting — Handling Issues in Generated Projects

When a user scaffolds a project with your wrapper, the injected code may trigger ESLint/TS warnings. Here's what causes them and how to prevent them.

### Common Linting Issues

#### 1. `.js` Extension in Imports

```
# User runs eslint on scaffolded project
Error: Unexpected use of file extension ".js" for "./client.js"
```

**Why it happens:** Wrapper code uses `.js` extensions in imports (required for ESM). Some ESLint configs (especially Next.js default) flag this.

**Fix:** Add this rule to the wrapper code or document it in the README:

```json
// In the user's project .eslintrc or eslint.config:
{
  "rules": {
    "import/extensions": ["error", "ignorePackages", { "js": "always" }]
  }
}
```

**Better fix:** The base templates should already account for this. If a base template uses ESLint rules that ban `.js` extensions, the wrapper's `README.md` should note this.

#### 2. Unused Imports (After Removing Boilerplate)

**Why it happens:** Some wrapper files export types/functions that may not be used immediately.

**Fix:** Structure wrapper code so that the barrel export (`index.ts`) only exports what's immediately needed. If something might be unused, wrap it behind a clear comment:

```typescript
// index.ts — only export what's needed by the user
export { db } from "./client.js";  // Used immediately
// export { seed } from "./seed.js";  // Uncomment when ready for seeding
```

#### 3. `@typescript-eslint/no-unused-vars`

**Why it happens:** Schema definitions or config objects may declare variables that ESLint sees as unused.

**Fix:** Use `_` prefix for intentionally unused parameters, or use `export` on schema objects:

```typescript
// ✅ Export schema objects — they're used by other files via import
export const users = pgTable("users", { ... });
```

#### 4. TypeScript `strict` Mode Violations

**Why it happens:** If a base template has `strict: true` in `tsconfig.json`, wrapper code must be fully typed.

**Fix:** Always add explicit types. Never use `any`:

```typescript
// ❌ Avoid
export function getClient(config: any) { ... }

// ✅ Always type explicitly
export function getClient(config: DbConfig) { ... }
```

#### 5. Undefined Variable / Missing Import (Deps Not Installed)

**Why it happens:** The wrapper references `zod`, `drizzle-orm`, etc. but deps haven't been installed yet.

**Fix:** The CLI prompts to install deps. If the user skips install, the linter will flag missing imports. This is expected — install fixes it.

### Pre-Commit Lint Check for Wrapper Code

Before submitting a wrapper, lint-check the files yourself:

```bash
# Copy your wrapper files into a real Next.js/Vite/Express project
# that has ESLint configured, then run lint:

cd test-project
npx eslint src/wrappers/<tag>/  # Check for issues
npx tsc --noEmit                 # Check for TS errors
```

### Option: Skip Lint for Generated Wrapper Code

If the base template uses ESLint and you don't want wrapper code to trigger warnings, recommend adding this to the generated project's `.eslintignore`:

```
src/wrappers/
```

Alternatively, the CLI can auto-generate a `.eslintignore` entry. This is not implemented yet, but the `_root/` pattern could be extended for it.

### Wrapper Code Lint Checklist

- [ ] No `any` types
- [ ] All exports are named (not default)
- [ ] No unused variables or imports
- [ ] All async functions have proper error handling
- [ ] `.js` extensions used in all relative imports
- [ ] Run `npm run build` in the CLI project — no errors
- [ ] Run `tsc --noEmit` in a scaffolded project with the wrapper — no TS errors

---

## Distribution — Publishing the CLI to npm

The CLI is currently published as `scaffy-temp` on npm. This section covers how to publish updates and how distribution works.

### How the CLI Locates Wrappers at Runtime

The CLI finds `templates/` and `wrappers/` by searching relative to the running script via `findRepoRoot()`:

```typescript
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
```

This works in two scenarios:

| Scenario | `__dirname` | Found at |
|---|---|---|
| Running from local clone | `dist/cli/` or `cli/` | `../../templates` (project root) |
| Installed via npm | `node_modules/scaffy-temp/dist/cli/` | `../../../templates` (inside package) |

### Publishing Workflow

#### 1. Update `package.json` Fields

```bash
# Bump version
npm version patch  # or minor, or major
```

#### 2. Update the `files` Array

The `files` array in `package.json` controls what gets published to npm. The CLI needs both `templates/` and `wrappers/` at runtime, so they must be included:

```json
{
  "files": [
    "dist",
    "templates",
    "wrappers",
    "README.md",
    "LICENSE"
  ]
}
```

**Without `templates` and `wrappers` in `files`**, the published package won't include them, and `findRepoRoot()` will fail to find them.

#### 3. Build

```bash
npm run build
```

#### 4. Dry-Run Publish (Optional)

Check what will be published:

```bash
npm pack --dry-run
```

Verify that `templates/` and `wrappers/` appear in the list of files to be included.

#### 5. Publish

```bash
npm publish
```

### Two Distribution Modes

#### Mode A: npm Package (Recommended for Most Users)

```
npm install -g scaffy-temp
scaffy-temp init my-app -b nextjs-app-router -w zod drizzle
```

**Pros:** Familiar workflow, no clone needed, versioned releases.
**Cons:** Package size includes all templates and wrappers. Each publish requires a version bump.

#### Mode B: Direct from Clone (For Development/Testing)

```
git clone https://github.com/Darsh2126/folder-structures.git
cd folder-structures
npm install
npm run build
node dist/src/cli.js init my-app -b nextjs-app-router -w zod drizzle
```

**Pros:** No publish needed, instant iteration, user always has latest.
**Cons:** Requires a git clone, more steps.

### What Gets Published

After `npm publish`, users get:

```
node_modules/scaffy-temp/
  dist/
    cli/index.js       ← CLI logic
    src/cli.js         ← entry point (shebang)
  templates/
    nextjs-app-router/ ← bare scaffolds
    react-vite/
    node-express/
    config.json
  wrappers/
    zod-wrapper/       ← composable chunks
    drizzle-wrapper/
    auth-wrapper/
    rhf-wrapper/
  package.json
  README.md
  LICENSE
```

The `findRepoRoot()` function walks up from `node_modules/scaffy-temp/dist/cli/index.js` and finds `templates/` inside the package directory. This works because npm preserves the package directory structure.

### Version Strategy

| Version | When |
|---|---|
| `2.0.x` | Bug fixes, non-breaking wrapper additions |
| `2.x.0` | New CLI features (breaking wrapper additions) |
| `3.0.0` | Breaking CLI API changes |

Wrapper versions are tracked in `wrapper.json` and recorded in `scaffold.lock` — they're independent of the CLI version.

### Distribution Checklist

- [ ] `npm run build` succeeds
- [ ] `npm pack --dry-run` shows `templates/` and `wrappers/` included
- [ ] `files` array in `package.json` includes `"templates"` and `"wrappers"`
- [ ] Version bumped appropriately
- [ ] Test install locally: `npm install -g .` then run `scaffy-temp init`
- [ ] No secrets or large unnecessary files in the package

---

## File-by-File Reference — What Each File Does

### Root Level

| File | Role |
|---|---|
| `package.json` | Package registry. Defines `bin` (CLI entry), `scripts`, `dependencies`, and `files` (what gets published to npm) |
| `tsconfig.json` | TypeScript compiler config. `rootDir: "."` and `include: ["src", "cli"]` — compiles both `src/` and `cli/` into `dist/` |
| `PLANNING.md` | Architecture reference doc — high-level design decisions |
| `CONTRIBUTING.md` | How-to guide — add wrappers, test, lint, distribute (this file) |

---

### `src/cli.ts` — Entry Stub

**Purpose:** The file that `package.json` `"bin"` points to. Just re-exports to the real CLI:

```typescript
#!/usr/bin/env node
import "../cli/index.js";
```

The real code lives in `cli/`. This file exists as a stable entry point so the `bin` field doesn't need to change.

---

### `cli/` — CLI Logic (The Brain)

#### `cli/index.ts` — Main Orchestrator

**Purpose:** Wires everything together. Defines two commands (`init` and `add`) using `commander`.

| Internal function | What it does |
|---|---|
| `findRepoRoot()` | Walks up directories from the running script to find the project root (where `templates/` lives). Works both from `dist/` (compiled) and from source. |
| `getBases()` | Scans `templates/` directory + reads `config.json` for descriptions. Returns `BaseTemplate[]`. |
| `getAvailableWrappers()` | Scans `wrappers/` directory, reads each `wrapper.json`. Returns `WrapperManifest[]`. |

**`init` command — step by step:**

| Step | What happens | CLI module used |
|---|---|---|
| 1 | User picks a base template (or `-b` flag) | `prompt.ts` → `pickBase()` |
| 2 | User picks wrappers — incompatible ones greyed out | `prompt.ts` → `pickWrappers()` |
| 3 | Dependencies resolved, conflicts checked | `resolver.ts` → `resolveWrappers()` |
| 4 | Base template copied to project directory | `injector.ts` → `copyBaseTemplate()` |
| 5 | Each wrapper's `_files/` copied into project | `injector.ts` → `injectFiles()` |
| 6 | Each wrapper's `_root/` copied with collision check | `injector.ts` → `injectRootFiles()` |
| 7 | Missing npm deps added to `package.json` | `merger.ts` → `mergePackageJson()` |
| 8 | Missing env vars appended to `.env.example` | `merger.ts` → `mergeEnvExample()` |
| 9 | `scaffold.lock` written | `merger.ts` → `writeLockFile()` |
| 10 | User prompted to run `npm install` | `merger.ts` → `printInstallCommand()` |

**`add` command — step by step:**

| Step | What happens | CLI module used |
|---|---|---|
| 1 | Reads existing `scaffold.lock` | Direct `fs.readJson` |
| 2 | Resolves deps including existing wrappers (avoids re-adding) | `resolver.ts` → `resolveWrappers()` |
| 3 | Only injects NEW wrappers (not already in lockfile) | `injector.ts` → `injectWrapper()` |
| 4 | Merges package.json + .env for new wrappers only | `merger.ts` |
| 5 | Updates scaffold.lock | `merger.ts` → `writeLockFile()` |

#### `cli/types.ts` — Shared Type Definitions

**Purpose:** The contract layer. Every other CLI module imports from here.

| Type | Purpose |
|---|---|
| `WrapperJson` | Shape of `wrapper.json` on disk (tag, label, targets, needs, conflicts, packages, env_vars, version) |
| `WrapperManifest` | In-memory version — adds computed fields: `filesDir`, `rootDir`, `wrapperJsonPath` |
| `ScaffoldLock` | Shape of `scaffold.lock` written to user's project |
| `BaseTemplate` | Describes a template (name, label, dir) |
| `CliOptions` | Flags collected from CLI args |

**When adding a new field to `wrapper.json`**, add it to `WrapperJson` first. TypeScript will flag every place that uses it.

#### `cli/resolver.ts` — Dependency Resolver

**Purpose:** Pure logic — no file I/O. Two responsibilities:

1. **Dependency resolution (BFS):**
   - Takes requested wrapper tags + all available wrappers
   - For each wrapper, checks its `needs` array
   - Auto-adds missing dependencies using a breadth-first queue
   - Uses a `visited` set to prevent infinite loops

2. **Conflict detection:**
   - Pairs every selected wrapper
   - Checks their `conflicts` arrays against each other
   - If A conflicts with B (or vice versa) → pushes an error

Returns:
```typescript
{
  selected: WrapperManifest[]   // Final list (requested + auto-added deps)
  errors: string[]               // Fatal — stop the process
  warnings: string[]             // Non-fatal — show but continue
}
```

#### `cli/injector.ts` — File Copier

**Purpose:** The only module that actually writes files to disk.

| Function | Source | Destination | Called by |
|---|---|---|---|
| `injectFiles()` | `_files/` contents (as-is, relative) | `projectDir/` → mirrors `_files/` structure | `injectWrapper()` |
| `injectRootFiles()` | `_root/` contents (flat files) | `projectDir/` (directly, no prefix) | `injectWrapper()` |
| `copyBaseTemplate()` | `templates/<base>/` | `projectDir/` | `init` command |

**`handleRootFile()`** implements the collision table:

| Situation | Behaviour |
|---|---|
| Target doesn't exist | Copy directly, no prompt |
| `scaffold.lock` shows it's from this wrapper | Skip silently (idempotent) |
| Target exists, unknown origin | Prompt user: overwrite / skip / merge |

#### `cli/merger.ts` — Package + Env + Lock Merging

**Purpose:** Non-destructive merging. Never overwrites existing data.

| Function | What it does |
|---|---|
| `mergePackageJson()` | Reads project's `package.json`. For each wrapper, adds missing deps at version `"latest"`. Never downgrades or removes existing entries. |
| `mergeEnvExample()` | Reads `.env.example`. For each wrapper's `env_vars`, checks if the key prefix already exists. Appends new vars under `# --- <tag>-wrapper ---` comment. |
| `printInstallCommand()` | Collects all unique deps, prints them, asks user to run `npm install` now or prints the command |
| `writeLockFile()` | Writes `scaffold.lock` with base name + wrapper list (tag + version) + timestamp |

#### `cli/prompt.ts` — Interactive Prompts

**Purpose:** Wraps `inquirer` behind descriptive function names.

| Function | What user sees | Notes |
|---|---|---|
| `pickBase()` | List of base templates | One choice |
| `pickWrappers()` | Checkbox list of wrappers | Incompatible ones are greyed out (`disabled: true`) |
| `askProjectName()` | Text input | Regex validation: `a-zA-Z0-9-_` |
| `askInstallConfirmation()` | Y/n prompt | Shows the full install command |
| `askRootFileAction()` | List: overwrite / skip / merge | Only shown when root file already exists |

---

### `templates/` — Base Scaffolds

These are **bare project shells** — no auth, no ORM, no form libraries.

| File / Directory | Purpose |
|---|---|
| `templates/config.json` | Registry mapping template names to descriptions for CLI prompts |
| `templates/nextjs-app-router/` | Next.js 15 + Tailwind v4 + TypeScript — just the framework shell |
| `templates/react-vite/` | Vite 6 + React 19 + Tailwind v4 + TypeScript — just the framework shell |
| `templates/node-express/` | Express 5 + TypeScript — just the framework shell |

Each template has its own `package.json`, `tsconfig.json`, and framework-specific config files. They have **zero integration code** (no Prisma, no auth, no forms) — all integrations come from wrappers.

---

### `wrappers/` — Composable Integration Chunks

Every wrapper follows this exact pattern:

```
wrappers/<tag>-wrapper/
  _files/          ← code that lands in user's project
    src/
      wrappers/<tag>/
        index.ts   ← barrel export (MUST have this)
        ...
  _root/           ← files that MUST be at project root (optional)
    <config-file>
  wrapper.json     ← metadata
  README.md        ← "wire it up" guide
```

#### `wrappers/zod-wrapper/` — Simplest (leaf dep)

| File | What it does |
|---|---|
| `wrapper.json` | tag: `zod`, targets: `*`, needs: `[]`, conflicts: `[]` |
| `_files/.../index.ts` | Barrel export — re-exports from schemas.ts and types.ts |
| `_files/.../schemas.ts` | Reusable Zod schemas (email, password, UUID, pagination) |
| `_files/.../types.ts` | Zod utility types (ZodInfer, ZodInput, ZodOutput) |
| `README.md` | Wire-it-up instructions |

Why it exists: Most other wrappers depend on it. It's the leaf node in the dependency graph.

#### `wrappers/drizzle-wrapper/` — Demonstrates `_root/`

| File | What it does |
|---|---|
| `_files/.../index.ts` | Barrel export |
| `_files/.../client.ts` | `postgres-js` connection singleton, exports `db` |
| `_files/.../schema.ts` | Base `pgTable` definitions (users table with timestamps) |
| `_root/drizzle.config.ts` | Drizzle config pointing to the wrapper's schema path |
| `wrapper.json` | needs: `["zod"]`, conflicts: `["prisma"]` |

Why `_root/` exists: Drizzle CLI (`drizzle-kit`) expects `drizzle.config.ts` at the project root, not inside `src/`.

#### `wrappers/auth-wrapper/` — NextAuth Integration

| File | What it does |
|---|---|
| `_files/.../index.tsx` | Barrel export |
| `_files/.../provider.tsx` | `SessionProvider` — client component wrapping the app |
| `_files/.../config.ts` | NextAuth config with Credentials provider + Zod validation |
| `_files/.../types.ts` | Augments `next-auth` Session type to include `user.id` |
| `_root/auth.config.ts` | Creates NextAuth handler (exports handlers, auth, signIn, signOut) |
| `wrapper.json` | targets: nextjs only, needs: `["zod"]` |

#### `wrappers/rhf-wrapper/` — React Hook Form + Zod

| File | What it does |
|---|---|
| `_files/.../index.ts` | Barrel export |
| `_files/.../useFormWrapper.ts` | `useZodForm` hook — wraps `useForm` with `zodResolver` pre-configured |
| `_files/.../FormField.tsx` | Controlled input component with label + error display |
| `_files/.../types.ts` | Helper types (ZodFormReturn, FormValues) |
| `wrapper.json` | targets: nextjs + react, needs: `["zod"]` |

---

### `scaffold.lock` — Generated Output (Not in Repo)

**Purpose:** Records what was scaffolded — enables idempotent `add` commands and reproducible builds.

```json
{
  "base": "nextjs-app-router",
  "wrappers": [
    { "tag": "drizzle", "version": "1.0.0" },
    { "tag": "auth", "version": "1.0.0" }
  ],
  "scaffoldedAt": "2026-05-13T00:00:00Z"
}
```

Used by:
- `injector.ts` — to know if a root file already belongs to a wrapper (skip if so)
- `add` command — to know what's already installed (only inject new ones)

---

### Summary — How to Think About the System

```
src/cli.ts         →  The door (just a re-export)
cli/index.ts      →  The conductor (orchestrates everything)
cli/types.ts      →  The vocabulary (shared types)
cli/resolver.ts   →  The librarian (knows deps and conflicts)
cli/injector.ts   →  The mover (copies files)
cli/merger.ts     →  The editor (merges json/env safely)
cli/prompt.ts     →  The receptionist (asks user questions)

templates/*/      →  Bare rooms (empty framework shells)
wrappers/*/       →  Furniture boxes (assembly instructions in wrapper.json)

scaffold.lock     →  The receipt (what was installed)
```

**When adding a new integration:**
- **New library** → create a wrapper in `wrappers/` — no CLI changes needed
- **New framework** → create a base template in `templates/` + update `config.json` + update wrapper targets
- **New CLI feature** → modify files inside `cli/`
