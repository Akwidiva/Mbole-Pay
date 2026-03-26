"use client"

import Link from "next/link"
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react"
import { AuthForm } from "@/components/auth/auth-form"

const highlights = [
  "Encrypted member data",
  "Instant contribution tracking",
  "Automated payout queue",
]

export default function SignInPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <aside className="relative hidden bg-primary lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-purple-700" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div>
            <Link href="/" className="inline-flex items-center text-sm font-semibold opacity-80 hover:opacity-100">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to landing
            </Link>
            <h1 className="mt-10 text-4xl font-semibold leading-tight">
              Welcome back to Mbole Pay
            </h1>
            <p className="mt-4 max-w-md text-primary-foreground/80">
              Continue orchestrating transparent Njangi cycles with live ledgers, payout automation, and dispute-proof member records.
            </p>
          </div>
          <div className="space-y-4">
            {highlights.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 backdrop-blur">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-sm font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
      <section className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div>
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Sparkles className="mr-2 h-3 w-3" /> Secure Sign In
            </div>
            <h2 className="mt-6 text-3xl font-bold">Access your workspace</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in with your credentials or Google. New here? <Link href="/signup" className="font-semibold text-primary">Create an account</Link>.
            </p>
          </div>
          <AuthForm mode="signin" className="bg-card p-6 shadow-sm rounded-2xl border" />
          <p className="text-center text-xs text-muted-foreground">
            By continuing you agree to Mbole Pay's usage guidelines.
          </p>
        </div>
      </section>
    </div>
  )
}


