# folder-structures — Modular Wrapper Architecture

## Problem

Templates (full folder dumps) break down when:
- You need only **part** of a stack (e.g., add Drizzle to an existing Next.js project)
- Every project combination would need its own separate template branch
- Auth, DB, form code is duplicated across every template

## Solution: Wrapper Registry + CLI

Break reusable structural chunks into **wrappers** — self-contained folder units, each solving one integration concern. A CLI reads user choices and injects selected wrappers into their project.

---

## Repo Layout

```
folder-structures/
  templates/                    ← bare project scaffolds (no integrations)
    nextjs-app-router/          ← Next.js shell
    react-vite/                 ← Vite + React shell
    node-express/               ← Express shell

  wrappers/                     ← composable integration chunks
    zod-wrapper/
    drizzle-wrapper/
    auth-wrapper/
    rhf-wrapper/

  cli/                          ← CLI source (TypeScript)
    index.ts                    ← entry point (init + add)
    resolver.ts                 ← dep graph, conflict checks
    injector.ts                 ← file copier + root handler
    merger.ts                   ← package.json + .env merging
    prompt.ts                   ← interactive selection

  src/
    cli.ts                      ← thin re-export to cli/

  scaffold.lock                 ← generated at init/add
```

---

## Wrapper Anatomy

Every wrapper follows the same structure:

```
wrappers/<tag>-wrapper/
  _files/                       ← copied into src/wrappers/<tag>/
    src/
      wrappers/<tag>/
        index.ts
        ...
  _root/                        ← copied to project root (for config files)
    drizzle.config.ts
    ...
  wrapper.json                  ← machine-readable metadata
  README.md                     ← "Wire it up" guide
```

### `wrapper.json` Schema

```json
{
  "tag": "drizzle",
  "label": "Drizzle ORM Wrapper",
  "targets": ["nextjs", "node-express"],
  "injects_into": "src/wrappers/drizzle/",
  "root_files": ["drizzle.config.ts"],
  "needs": ["zod"],
  "conflicts": ["prisma"],
  "packages": {
    "dependencies": ["drizzle-orm", "postgres"],
    "devDependencies": ["drizzle-kit"]
  },
  "env_vars": ["DATABASE_URL"]
}
```

---

## File Placement — `_root/` vs `_files/`

| File | Lives in wrapper as | CLI places at |
|---|---|---|
| Drizzle client | `_files/src/wrappers/drizzle/client.ts` | `project/src/wrappers/drizzle/client.ts` |
| Drizzle config | `_root/drizzle.config.ts` | `project/drizzle.config.ts` |
| Auth provider | `_files/src/wrappers/auth/provider.tsx` | `project/src/wrappers/auth/provider.tsx` |
| Auth config | `_root/auth.config.ts` | `project/auth.config.ts` |

The CLI inspects each wrapper. Files under `_files/` are prefixed with the project `src/` path. Files under `_root/` go directly to the project root with collision checks.

---

## CLI Commands

### `init` — Fresh project

```
$ node dist/cli.js init

? Pick your base:
  1. Next.js (App Router)
  2. React + Vite
  3. Node + Express

? Pick your wrappers: (space to select)
  ◉ zod
  ◉ drizzle
  ◯ prisma          ← greyed out (conflicts with drizzle)
  ◉ auth
  ◉ rhf

Resolving dependencies...
  drizzle needs: zod → auto-adding zod ✓

Scaffolding project... ✓
Installing packages... (prompt: Y/n)
Appending .env.example... ✓
Writing scaffold.lock... ✓
```

### `add` — Existing project

```
$ node dist/cli.js add drizzle auth

Injecting drizzle-wrapper → src/wrappers/drizzle/ ✓
Placing drizzle.config.ts → project root ✓
Injecting auth-wrapper → src/wrappers/auth/ ✓
Merging package.json deps... ✓
Appending .env.example... ✓
Updating scaffold.lock... ✓
```

---

## Root File Collision Handling

| Situation | Behaviour |
|---|---|
| Root file doesn't exist | Copy directly, no prompt |
| Root file exists, from this wrapper | Skip (idempotent) |
| Root file exists, unknown origin | Prompt: `[o]verwrite / [s]kip / [m]erge` |

---

## scaffold.lock

Records what was injected for reproducibility:

```json
{
  "base": "nextjs-app-router",
  "wrappers": [
    { "tag": "drizzle", "version": "1.0.0", "instance": "primary" },
    { "tag": "auth", "version": "1.0.0" },
    { "tag": "rhf", "version": "1.0.0" }
  ],
  "scaffoldedAt": "2026-05-13T00:00:00Z"
}
```

---

## Execution Order

1. Create `cli/` modules (types, prompt, resolver, injector, merger, index)
2. Rewrite `src/cli.ts` as thin entry
3. Create 4 wrappers (zod, drizzle, auth, rhf)
4. Update `tsconfig.json` + `package.json`
5. Strip existing `templates/` to bare bases
6. Build and test

---

## Detailed File Breakdown

### `cli/types.ts` — Shared Interfaces

Defines all TypeScript types that flow between CLI modules:

```typescript
WrapperJson        // Shape of wrapper.json files on disk
WrapperManifest    // In-memory representation after loading wrapper.json
ScaffoldLock       // Structure of the output scaffold.lock file
BaseTemplate       // Represents a base template (name, label, dir)
CliOptions         // Options collected from CLI flags
```

Think of this as the **contract layer** — every other module imports from here. If you add a new field to `wrapper.json`, add it to `WrapperJson` first, then all modules get type-safe access automatically.

---

### `cli/prompt.ts` — Interactive Prompts

Wraps `inquirer` behind descriptive function names:

| Function | What it does |
|---|---|
| `pickBase(bases)` | Shows a list of base templates, user picks one |
| `pickWrappers(wrappers, target, conflicts)` | Checkbox multiselect — greys out incompatible/conflicting wrappers |
| `askProjectName()` | Validates project name with regex (`a-zA-Z0-9-_`) |
| `askInstallConfirmation(command)` | Y/n prompt: "Run `npm install ...` now?" |
| `askRootFileAction(filename, path)` | Conflict resolution: overwrite / skip / merge |

Key detail in `pickWrappers`: wrappers that don't target the selected base or conflict with already-selected wrappers are automatically **disabled** (greyed out) — the user can't select them.

---

### `cli/resolver.ts` — Dependency Resolution

Pure-logic module with zero I/O. Two responsibilities:

**1. Dependency resolution (BFS):**
```
requested: ["drizzle"]
→ drizzle needs ["zod"] → auto-add zod
→ zod needs [] → done
result: ["drizzle", "zod"]
```

Uses a **breadth-first queue** with a visited set to avoid cycles. If wrapper A needs B and B needs A, the visited set prevents infinite loops.

**2. Conflict detection:**
Iterates every pair of selected wrappers. If A conflicts with B (or vice versa), pushes an error. Resolution fails and the CLI exits with the error message.

Returns `ResolutionResult`:
```typescript
{
  selected: WrapperManifest[]   // Final list (auto-deps included)
  errors: string[]               // Fatal — stop the process
  warnings: string[]             // Non-fatal — show but continue
}
```

---

### `cli/injector.ts` — File Copier + Root Handler

Handles three distinct copy operations:

**`injectFiles()` — `_files/` → project:**
Walks the `_files/` directory of a wrapper and **mirrors its structure** relative to the project root. Since `_files/` contains `src/wrappers/<tag>/...`, the files land at the correct path. Uses a recursive copy function that handles nested directories.

**`injectRootFiles()` — `_root/` → project root:**
Lists entries in `_root/`. For each file, calls `handleRootFile()` which implements the collision table:

| Situation | Behaviour |
|---|---|
| Target doesn't exist | Copy directly |
| `scaffold.lock` shows it's from this wrapper | Skip (idempotent — `add` twice is safe) |
| Target exists, unknown origin | Prompt user: overwrite / skip / merge |

**`copyBaseTemplate()` — template → project:**
Copies an entire base template directory, filtering out dotfiles except `.gitignore` and `.env.example`.

---

### `cli/merger.ts` — Package + Env + Lockfile Merging

Three merge operations, all **append-only / never destructive**:

**`mergePackageJson()`:**
Reads the project's `package.json`. For each wrapper, iterates its `packages.dependencies` and `packages.devDependencies`. Adds any missing entry with version `"latest"`. Never downgrades or removes existing entries.

**`mergeEnvExample()`:**
Reads existing `.env.example`. For each wrapper's `env_vars`, checks if the key prefix already exists. Only appends new variables under a `# --- <tag>-wrapper ---` section comment. Never duplicates.

**`printInstallCommand()`:**
Collects all unique deps across wrappers, prints them grouped by regular vs dev, then asks the user if they want to run `npm install` now. If yes, runs via `child_process.execSync`. If no, prints the command for manual execution.

**`writeLockFile()`:**
Writes `scaffold.lock` to the project root with base name, wrapper list (tag + version), and timestamp.

---

### `cli/index.ts` — CLI Entry Point

Uses `commander` to define two commands:

**`init [project-name]`:**

1. `getBases()` — scans `templates/` directory + reads `config.json` for descriptions
2. `getAvailableWrappers()` — scans `wrappers/` directory, reads each `wrapper.json`
3. Picks base (interactive or `-b` flag)
4. Picks wrappers (interactive or `-w` flag) — incompatible ones greyed out
5. `resolveWrappers()` — builds dep graph, checks conflicts
6. `copyBaseTemplate()` — copies the base scaffold
7. `injectWrapper()` — copies each wrapper's `_files/` and `_root/`
8. `mergePackageJson()` / `mergeEnvExample()` — merges deps
9. `writeLockFile()` — writes `scaffold.lock`
10. `printInstallCommand()` — prompt to install deps

**`add <wrappers...>`:**

1. Reads existing `scaffold.lock` to know what's already injected
2. Resolves deps including existing wrappers (avoids re-adding)
3. Only injects **new** wrappers (not already in lockfile)
4. Merges package.json + .env + updates lockfile
5. Prompts to install only the new deps

The `findRepoRoot()` function at the top dynamically locates the project root by checking for the `templates/` directory relative to the running script's location — works both from `dist/` (compiled) and from source.

---

### `src/cli.ts` — Thin Entry Stub

Two lines — just re-exports the real entry:

```typescript
#!/usr/bin/env node
import "../cli/index.js";
```

This exists so the `package.json` `"bin"` field (`./dist/src/cli.js`) maps to something. The real code lives in `cli/`.

---

### Wrappers — Shared Anatomy

Every wrapper has the same structure. Here's what each wrapper delivers:

#### `zod-wrapper/` — Leaf dependency, no deps
```
_files/src/wrappers/zod/
  schemas.ts   → reusable Zod schemas (email, password, UUID, pagination)
  types.ts     → utility types (ZodInfer, ZodInput, ZodOutput)
  index.ts     → barrel exports
wrapper.json   → tag: "zod", targets: all, needs: [], conflicts: []
```
Simplest wrapper — no `_root/` (no config files at project root), no dependencies on other wrappers.

#### `drizzle-wrapper/` — Demonstrates `_root/` placement
```
_files/src/wrappers/drizzle/
  client.ts    → postgres-js connection singleton
  schema.ts    → base pgTable definitions (users table)
  index.ts     → barrel exports
_root/
  drizzle.config.ts  → placed at project root, configured for wrapper schema path
wrapper.json   → tag: "drizzle", needs: ["zod"], conflicts: ["prisma"]
               → packages: drizzle-orm, postgres, drizzle-kit
               → env_vars: DATABASE_URL
```
Shows the core `_root/` pattern. The config file lives at project root because Drizzle expects it there, but the actual code lives inside `src/wrappers/drizzle/`.

#### `auth-wrapper/` — NextAuth integration
```
_files/src/wrappers/auth/
  provider.tsx  → SessionProvider client component
  config.ts     → NextAuth config with credentials provider + zod validation
  types.ts      → Session type augmentation
  index.tsx     → barrel exports
_root/
  auth.config.ts  → exports handlers, auth, signIn, signOut
wrapper.json   → tag: "auth", targets: nextjs only, needs: ["zod"]
               → packages: next-auth, @auth/core
               → env_vars: AUTH_SECRET, AUTH_URL
```
Depends on `zod` (uses zod schemas for credential validation). Has both `_files/` (provider + config) and `_root/` (root-level auth config).

#### `rhf-wrapper/` — React Hook Form + Zod
```
_files/src/wrappers/rhf/
  useFormWrapper.ts  → useZodForm hook (zodResolver pre-configured)
  FormField.tsx      → controlled input with error display
  types.ts           → helper types
  index.ts           → barrel exports
wrapper.json   → tag: "rhf", targets: nextjs + react, needs: ["zod"]
               → packages: react-hook-form, @hookform/resolvers
               → no root files
```
Depends on `zod` (uses zodResolver from hookform/resolvers). No `_root/` — all config is done via the hook API.

---

### `package.json` — Changes Made

| Field | Before | After |
|---|---|---|
| Version | `1.0.6` | `2.0.0` |
| Dependencies | chalk, commander, degit, fs-extra, inquirer, mustache, node-fetch, ora, tar | chalk, commander, fs-extra, inquirer |
| `bin` | `./dist/cli.js` (degit-based) | `./dist/src/cli.js` (wrapper-based) |
| `postbuild` | Complex cat + temp file for shebang | `chmod +x dist/src/cli.js dist/cli/index.js` |

Removed 5 dependencies: `degit`, `mustache`, `node-fetch`, `ora`, `tar` — no longer needed since we copy from local files, not remote git repos.

---

### `tsconfig.json` — Changes Made

| Field | Before | After |
|---|---|---|
| `rootDir` | `src` | `.` (project root, to include `cli/`) |
| `include` | `["src"]` | `["src", "cli"]` |
| New | — | `"declaration": true`, `"sourceMap": true` |

The `rootDir: "."` is critical — the CLI modules live under `cli/` which is at the project root, not under `src/`. Setting rootDir to `.` lets TypeScript compile both `src/cli.ts` → `dist/src/cli.js` and `cli/*.ts` → `dist/cli/*.js`.

---

### Stripped Templates

| Old Name | New Name | What was removed |
|---|---|---|
| `fullstack-next/` | `nextjs-app-router/` | Prisma schema + seed, auth API routes, bcrypt, lib/prisma client |
| `node-auth-basic/` | `node-express/` | Prisma schema + client, auth controller + routes, bcryptjs, jsonwebtoken |
| `react-ts-tailwind-rtk-wrapper/` | `react-vite/` | Renamed (already clean — no RTK or auth) |
| `next-normal-auth/` | **Deleted** | Replaced by nextjs-app-router base + auth/rhf wrappers |
| `react-tailwind-rtk-wrapper/` | **Deleted** | JS version — redundant with react-vite (TS)
