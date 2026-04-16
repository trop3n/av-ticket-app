"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import type { Session } from "next-auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LiveIndicator } from "@/components/shared/live-indicator"
import {
  LayoutDashboard,
  Kanban,
  PlusCircle,
  Shield,
  LogOut,
} from "lucide-react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "TECHNICIAN", "REQUESTER"] },
  { href: "/board/av", label: "AV Board", icon: Kanban, roles: ["ADMIN", "TECHNICIAN"] },
  { href: "/board/engineering", label: "Engineering Board", icon: Kanban, roles: ["ADMIN", "TECHNICIAN"] },
  { href: "/board/tech-support", label: "Tech Support Board", icon: Kanban, roles: ["ADMIN", "TECHNICIAN"] },
  { href: "/tickets/new", label: "New Ticket", icon: PlusCircle, roles: ["ADMIN", "TECHNICIAN", "REQUESTER"] },
  { href: "/admin", label: "Admin", icon: Shield, roles: ["ADMIN"] },
]

export function Navbar({ session }: { session: Session }) {
  const pathname = usePathname()
  const role = session.user.role

  const visibleItems = navItems.filter((item) => item.roles.includes(role))
  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        <Link href="/" className="font-semibold text-lg mr-4">
          IT Service Desk
        </Link>

        <nav className="flex items-center gap-1">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <LiveIndicator />
          <DropdownMenu>
            <DropdownMenuTrigger
              className="relative h-8 w-8 rounded-full focus:outline-none"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user.image || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {role.toLowerCase().replace("_", " ")}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
