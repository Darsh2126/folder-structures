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

## Common Mistakes

| Mistake | Fix |
|---|---|
| `_files/` path is `src/wrappers/<tag>/file.ts` but without `src/` prefix | Always include `src/` inside `_files/` — it mirrors the project structure |
| `wrapper.json` has `"targets": ["nextjs"]` but base is `"nextjs-app-router"` | Use exact base names as listed in `templates/config.json` |
| Using default exports in `index.ts` | Use named exports only |
| Importing without `.js` extension | Add `.js` extension to all relative imports |
| Putting application code in `_root/` | `_root/` is ONLY for files that MUST be at the project root (config files, CLI tool expectations) |
| Forgetting to run `npm run build` | Always build to verify TypeScript compilation |
| Adding `node_modules` or secrets to the wrapper | Never — wrappers are source code only |
