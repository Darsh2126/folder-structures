## Wire it up

1. Import schemas in your validation logic:
   ```ts
   import { emailSchema, passwordSchema } from "@/wrappers/zod";
   ```

2. Use zod resolver with React Hook Form:
   ```ts
   import { zodResolver } from "@hookform/resolvers/zod";
   ```

## What's inside
- schemas.ts → reusable Zod schemas (email, password, pagination, UUID)
- types.ts  → Zod utility types
- index.ts  → barrel export
