## Wire it up

1. Make sure DATABASE_URL is set in your .env file.

2. Import the db client:
   ```ts
   import { db } from "@/wrappers/drizzle";
   ```

3. Run migrations:
   ```bash
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```

## What's inside
- client.ts  → postgres-js db connection (singleton)
- schema.ts  → base table definitions (add yours here)
- index.ts   → barrel export

## Root files placed
- drizzle.config.ts → at project root, configured for wrapper schema path
