import { auth } from "@/lib/auth"
import { Navbar } from "./navbar"

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) return <>{children}</>

  return (
    <>
      <Navbar session={session} />
      <main className="flex-1">{children}</main>
    </>
  )
}
