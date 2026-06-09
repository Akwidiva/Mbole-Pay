import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { AdminNavbar } from "@/components/admin/admin-navbar"

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions)
  
  // Require authentication
  if (!session) {
    redirect("/signin")
  }
  
  // Only allow super admins
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(30,64,175,0.10),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] text-foreground">
      <div className="border-b border-white/40 bg-white/70 backdrop-blur-xl">
        <AdminNavbar />
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Suspense fallback={<div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">Loading admin...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  )
}
