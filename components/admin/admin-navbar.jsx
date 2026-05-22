"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Menu, X } from "lucide-react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { MboleLogo } from "@/components/mbole-logo"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export function AdminNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const adminLinks = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/groups", label: "Groups" },
    { href: "/admin/disputes", label: "Disputes" },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-sm">
            <div className="flex items-center justify-center rounded-full bg-red-600 p-1.5 text-white font-bold">
              <span className="text-xs">👑</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-semibold text-red-600">ADMIN</span>
              <span className="text-sm font-bold">
                <span className="text-primary">Mbole</span>
                <span className="text-secondary"> Pay</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {adminLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <motion.div key={link.href} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Link
                  href={link.href}
                  className={cn(
                    "transition-colors hover:text-foreground/80 relative",
                    isActive ? "text-primary font-bold" : "text-foreground/60"
                  )}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="admin-underline"
                      className="absolute bottom-[-4px] left-0 right-0 h-0.5 bg-primary"
                      initial={false}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Logout Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="hidden sm:flex gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Mobile Logout */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="md:hidden p-2 h-auto"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          className="md:hidden border-t p-4 space-y-2 bg-background"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {adminLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
              >
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start"
                >
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
