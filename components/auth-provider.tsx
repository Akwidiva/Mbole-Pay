"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"

type AuthProviderProps = {
  children: React.ReactNode
  session: Session | null
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}


