import type { NextAuthConfig } from "next-auth"
import type { UserRole } from "@prisma/client"

/**
 * Edge-safe auth config (no Node.js dependencies).
 * Used by middleware. The full config in auth.ts spreads this and adds
 * adapter, providers with authorize logic, and DB-dependent callbacks.
 */
export const authConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub!
      session.user.role = token.role as UserRole
      session.user.departmentId = token.departmentId as string | null
      return session
    },
  },
  providers: [], // populated in auth.ts
} satisfies NextAuthConfig

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: UserRole
      departmentId: string | null
    }
  }
}
