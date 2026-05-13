## Wire it up

1. Wrap your app layout with AuthProvider:
   ```tsx
   import { AuthProvider } from "@/wrappers/auth";
   ```

2. Set up the API route:
   ```ts
   // src/app/api/auth/[...nextauth]/route.ts
   import { handlers } from "@/wrappers/auth/config";
   export const { GET, POST } = handlers;
   ```

3. Add env vars to .env:
   - AUTH_SECRET
   - AUTH_URL

## What's inside
- provider.tsx → SessionProvider wrapper (client component)
- config.ts   → NextAuth config with credentials provider
- types.ts    → session type augmentation
- index.tsx   → barrel export

## Root files placed
- auth.config.ts → at project root, exports handlers, auth, signIn, signOut
