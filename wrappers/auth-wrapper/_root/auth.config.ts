import NextAuth from "next-auth";
import { authConfig } from "@/wrappers/auth";

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
