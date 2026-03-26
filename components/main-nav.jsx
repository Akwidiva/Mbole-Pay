"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Wallet } from "lucide-react"

export function MainNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAuthenticated = Boolean(session?.user)

  const protectedLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      active: pathname === "/dashboard",
    },
    {
      href: "/groups",
      label: "Groups",
      active: pathname?.startsWith("/groups"),
    },
    {
      href: "/transactions",
      label: "Transactions",
      active: pathname?.startsWith("/transactions"),
    },
    {
      href: "/disputes",
      label: "Disputes",
      active: pathname?.startsWith("/disputes"),
    },
  ]

  return (
    <div className="mr-4 flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <span className="hidden font-bold sm:inline-block">
          <span className="text-primary">Mbole</span> Pay
        </span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <Link
          href="/"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/" ? "text-primary font-bold" : "text-foreground/60",
          )}
        >
          Home
        </Link>
        {isAuthenticated &&
          protectedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors hover:text-foreground/80",
                link.active ? "text-primary font-bold" : "text-foreground/60",
              )}
            >
              {link.label}
            </Link>
          ))}
      </nav>
    </div>
  )
}
