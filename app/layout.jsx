import "@/app/globals.css"
import { Inter } from "next/font/google"
import { getServerSession } from "next-auth"
import { ThemeProvider } from "@/components/theme-provider"
import { ConditionalHeader } from "@/components/conditional-header"
import { SiteFooter } from "@/components/site-footer"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/sonner"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Mbole Pay - Community Savings Platform",
  description: "Digitize and automate your community savings groups with Mbole Pay",
}

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions)
  const isAuthenticated = Boolean(session?.user)
  const isAdmin = session?.user?.role === "SUPER_ADMIN"

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider session={session}>
            <div className="flex min-h-screen flex-col">
              {isAuthenticated && !isAdmin && <ConditionalHeader />}
              <main className="flex-1">{children}</main>
              {isAuthenticated && !isAdmin && <SiteFooter />}
            </div>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
