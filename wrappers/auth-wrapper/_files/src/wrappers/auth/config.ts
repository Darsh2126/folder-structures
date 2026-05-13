import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { emailSchema, passwordSchema } from "@/wrappers/zod";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = emailSchema
          .and(passwordSchema)
          .safeParse(credentials);
        if (!parsed.success) return null;

        const user = await validateUser(parsed.data);
        return user;
      },
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
};

async function validateUser(credentials: { email: string; password: string }) {
  const { email, password } = credentials;
  const res = await fetch(`${process.env.AUTH_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) return null;
  return res.json();
}
