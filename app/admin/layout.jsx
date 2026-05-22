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
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      
      <main className="container mx-auto py-6 px-4">
        <Suspense fallback={<div>Loading...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  )
}
