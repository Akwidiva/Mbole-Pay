"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Building2, Gauge, LogOut, Menu, ShieldAlert, X } from "lucide-react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { MboleLogo } from "@/components/mbole-logo"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export function AdminNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const adminLinks = [
    { href: "/admin", label: "Dashboard", icon: Gauge },
    { href: "/admin/users", label: "Users", icon: BarChart3 },
    { href: "/admin/groups", label: "Groups", icon: Building2 },
    { href: "/admin/disputes", label: "Disputes", icon: ShieldAlert },
  ]

  return (
    <nav className="sticky top-0 z-50">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/admin" className="group flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-[0_18px_30px_-18px_rgba(30,64,175,0.65)]">
            <span className="text-lg">👑</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/70">Admin Suite</span>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-primary">Mbole</span>
              <span className="text-secondary"> Pay</span>
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-white/90 p-1.5 text-sm font-medium shadow-sm md:flex">
          {adminLinks.map((link) => {
            const isActive = pathname === link.href
            const Icon = link.icon
            return (
              <motion.div key={link.href} whileHover={{ y: -1 }} transition={{ duration: 0.2 }}>
                <Link
                  href={link.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 transition-all",
                    isActive
                      ? "bg-gradient-to-r from-primary to-secondary text-white shadow-[0_14px_30px_-18px_rgba(30,64,175,0.6)]"
                      : "text-foreground/65 hover:bg-slate-100 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </motion.div>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="hidden gap-2 rounded-full border-border/70 bg-white/90 px-4 shadow-sm sm:flex"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>

          <button className="rounded-full border border-border/70 bg-white/90 p-2 shadow-sm md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="md:hidden h-auto rounded-full border border-border/70 bg-white/90 p-2 shadow-sm"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {isOpen && (
        <motion.div
          className="mx-auto md:hidden max-w-7xl border-t border-border/60 bg-white/95 px-4 py-4 shadow-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {adminLinks.map((link) => {
            const isActive = pathname === link.href
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
              >
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start gap-2 rounded-2xl"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            )
          })}
        </motion.div>
      )}
    </nav>
  )
}
