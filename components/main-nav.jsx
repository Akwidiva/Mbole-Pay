"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Wallet } from "lucide-react"

export function MainNav() {
  const pathname = usePathname()

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
        <Link
          href="/dashboard"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/dashboard" ? "text-primary font-bold" : "text-foreground/60",
          )}
        >
          Dashboard
        </Link>
        <Link
          href="/groups"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/groups") ? "text-primary font-bold" : "text-foreground/60",
          )}
        >
          Groups
        </Link>
        <Link
          href="/transactions"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/transactions") ? "text-primary font-bold" : "text-foreground/60",
          )}
        >
          Transactions
        </Link>
        <Link
          href="/disputes"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/disputes") ? "text-primary font-bold" : "text-foreground/60",
          )}
        >
          Disputes
        </Link>
      </nav>
    </div>
  )
}
