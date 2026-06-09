"use client"

import Link from "next/link"
import { useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, ShieldCheck, Sparkles, X } from "lucide-react"
import { AuthForm } from "@/components/auth/auth-form"
import { MboleLogo } from "@/components/mbole-logo"

const highlights = [
  "Encrypted member data",
  "Instant contribution tracking",
  "Automated payout queue",
]

export default function SignInPage() {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(30,64,175,0.5),transparent_35%),radial-gradient(circle_at_85%_25%,rgba(16,185,129,0.4),transparent_30%),radial-gradient(circle_at_60%_80%,rgba(6,182,212,0.35),transparent_35%)]" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.1fr_0.9fr] blur-[1.5px] scale-[1.01]">
        <aside className="relative hidden bg-primary/20 lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-secondary/70" />
          <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
            <div>
              <Link href="/" className="inline-flex items-center text-sm font-semibold opacity-80 hover:opacity-100">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to landing
              </Link>
              <div className="mt-10 mb-6 flex items-center gap-3">
                <MboleLogo className="h-12 w-12" />
                <div>
                  <h1 className="text-2xl font-bold">
                    <span className="text-white">Mbole</span> Pay
                  </h1>
                </div>
              </div>
              <h2 className="text-3xl font-semibold leading-tight">Welcome back</h2>
              <p className="mt-4 max-w-md text-primary-foreground/80">
                Continue orchestrating transparent Njangi cycles with live ledgers, payout automation, and dispute-proof
                member records.
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
          <div className="mx-auto w-full max-w-md space-y-8 opacity-70">
            <div>
              <div className="lg:hidden flex items-center gap-3 mb-6">
                <MboleLogo className="h-10 w-10" />
                <div>
                  <h1 className="text-xl font-bold">
                    <span className="text-primary">Mbole</span>
                    <span className="text-secondary"> Pay</span>
                  </h1>
                </div>
              </div>
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Sparkles className="mr-2 h-3 w-3" /> Secure Sign In
              </div>
              <h2 className="mt-6 text-3xl font-bold">Access your workspace</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in with your credentials or Google. New here?{" "}
                <Link href="/signup" className="font-semibold text-primary">
                  Create an account
                </Link>
                .
              </p>
            </div>
            <div className="bg-card p-6 shadow-sm rounded-2xl border">
              <p className="text-sm text-muted-foreground">Background content preview</p>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              By continuing you agree to Mbole Pay&apos;s usage guidelines.
            </p>
          </div>
        </section>
      </div>

      <motion.div
        className="fixed inset-0 z-20 bg-black/55 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      />

      <div className="fixed inset-0 z-30 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="relative w-full max-w-[520px] rounded-[20px] border border-white/20 bg-card/95 p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8"
        >
          <Link
            href="/"
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground transition hover:text-foreground"
            aria-label="Close sign in modal"
          >
            <X className="h-4 w-4" />
          </Link>

          <div className="pr-10">
            <div className="mb-5 flex items-center gap-3">
              <MboleLogo className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold">
                  <span className="text-primary">Mbole</span>
                  <span className="text-secondary"> Pay</span>
                </h1>
                <p className="text-xs text-muted-foreground">Secure Sign In</p>
              </div>
            </div>

            <h2 className="text-3xl font-bold">Welcome Back</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to manage your savings and contributions.
            </p>
          </div>

          <AuthForm mode="signin" className="mt-6" />

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Create Account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}


