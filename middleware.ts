import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  if (!req.auth && !req.nextUrl.pathname.startsWith("/auth")) {
    const newUrl = new URL("/auth/signin", req.nextUrl.origin)
    return Response.redirect(newUrl)
  }
})

export const config = {
  matcher: ["/((?!api/auth|auth|_next/static|_next/image|favicon.ico).*)"],
}
