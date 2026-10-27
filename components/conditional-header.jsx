"use client"

import { usePathname } from "next/navigation"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"

export function ConditionalHeader({ isAuthenticated }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith("/admin")

  // Don't show header on admin routes (admin layout has its own navbar)
  if (isAdmin) {
    return null
  }

  // Logged-out visitors only see the header on the landing page (for Sign in / Sign up);
  // the auth pages have their own full-screen layout.
  if (!isAuthenticated && pathname !== "/") {
    return null
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <MainNav />
        <UserNav />
      </div>
    </header>
  )
}
