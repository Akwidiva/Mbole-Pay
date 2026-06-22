"use client"

import Link from "next/link"
import { useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Trophy, Users, X } from "lucide-react"
import { AuthForm } from "@/components/auth/auth-form"
import { MboleLogo } from "@/components/mbole-logo"

const steps = [
  { title: "Name your Njangi", description: "Spin up a group with cycle frequency, amount, and invite code in seconds." },
  { title: "Invite trusted members", description: "Share the unique code and assign admin or member roles." },
  { title: "Automate contributions", description: "Track payments, payouts, and disputes from a single transparent ledger." },
]

export default function SignUpPage() {
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(30,64,175,0.5),transparent_34%),radial-gradient(circle_at_82%_28%,rgba(16,185,129,0.42),transparent_32%),radial-gradient(circle_at_64%_84%,rgba(6,182,212,0.34),transparent_34%)]" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[0.9fr_1.1fr] blur-[1.5px] scale-[1.01]">
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
                <Users className="mr-2 h-3 w-3" /> Create account
              </div>
              <h1 className="mt-6 text-3xl font-bold">Launch your savings circle</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Already have access?{" "}
                <Link href="/signin" className="font-semibold text-primary">
                  Sign in
                </Link>
                .
              </p>
            </div>
            <div className="bg-card p-6 shadow-sm rounded-2xl border">
              <p className="text-sm text-muted-foreground">Background content preview</p>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              We&apos;ll only use your details to manage your Njangi account. No spam, ever.
            </p>
          </div>
        </section>

        <aside className="relative hidden bg-muted/20 lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-secondary/70" />
          <div className="relative z-10 flex h-full flex-col justify-between p-12 text-primary-foreground">
            <div>
              <Link href="/" className="inline-flex items-center text-sm font-semibold opacity-80 hover:opacity-100">
                <ArrowLeft className="mr-2 h-4 w-4" /> Return home
              </Link>
              <div className="mt-10 mb-6 flex items-center gap-3">
                <MboleLogo className="h-12 w-12" />
                <div>
                  <h2 className="text-2xl font-bold">
                    <span className="text-white">Mbole</span> Pay
                  </h2>
                </div>
              </div>
              <h3 className="text-3xl font-semibold leading-tight">Grow contributions without spreadsheets.</h3>
              <p className="mt-4 max-w-md text-primary-foreground/80">
                Onboard members, set rules, and let Mbole Pay automate your Njangi, from reminders to payouts.
              </p>
            </div>
            <div className="space-y-5">
              {steps.map((step) => (
                <div key={step.title} className="rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Trophy className="h-4 w-4" /> {step.title}
                  </div>
                  <p className="mt-2 text-sm text-primary-foreground/80">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
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
            aria-label="Close sign up modal"
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
                <p className="text-xs text-muted-foreground">Create Account</p>
              </div>
            </div>

            <h2 className="text-3xl font-bold">Launch your savings circle</h2>
            <p className="mt-2 text-sm text-muted-foreground">Set up your profile and start managing contributions in minutes.</p>
          </div>

          <AuthForm mode="signup" className="mt-6" />

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/signin" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
