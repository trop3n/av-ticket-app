import NextAuth from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@prisma/client"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID!}/v2.0`,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, departmentId: true },
      })
      if (dbUser) {
        session.user.id = user.id
        session.user.role = dbUser.role
        session.user.departmentId = dbUser.departmentId
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
})

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
