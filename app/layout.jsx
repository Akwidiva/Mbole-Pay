import "@/app/globals.css"
import { Inter } from "next/font/google"
import { getServerSession } from "next-auth"
import { ThemeProvider } from "@/components/theme-provider"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
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

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider session={session}>
            <div className="flex min-h-screen flex-col">
              {isAuthenticated && (
                <header className="sticky top-0 z-40 border-b bg-background">
                  <div className="container flex h-16 items-center justify-between py-4">
                    <MainNav />
                    <UserNav />
                  </div>
                </header>
              )}
              <main className="flex-1">{children}</main>
              {isAuthenticated && <SiteFooter />}
            </div>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
