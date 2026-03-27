"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { MboleLogo } from "./mbole-logo"
import { motion } from "framer-motion"

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
        <MboleLogo className="h-8 w-8" />
        <span className="hidden font-bold sm:inline-block">
          <span className="text-primary">Mbole</span>
          <span className="text-secondary"> Pay</span>
        </span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Link
            href="/"
            className={cn(
              "transition-colors hover:text-foreground/80 relative",
              pathname === "/" ? "text-primary font-bold" : "text-foreground/60",
            )}
          >
            Home
            {pathname === "/" && (
              <motion.div
                layoutId="underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                initial={false}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        </motion.div>
        {isAuthenticated &&
          protectedLinks.map((link) => (
            <motion.div key={link.href} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <Link
                href={link.href}
                className={cn(
                  "transition-colors hover:text-foreground/80 relative",
                  link.active ? "text-primary font-bold" : "text-foreground/60",
                )}
              >
                {link.label}
                {link.active && (
                  <motion.div
                    layoutId="underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    initial={false}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          ))}
      </nav>
    </div>
  )
}
