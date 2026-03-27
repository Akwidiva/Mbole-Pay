"use client"

import Link from "next/link"
import { ArrowLeft, Users, Trophy } from "lucide-react"
import { AuthForm } from "@/components/auth/auth-form"
import { MboleLogo } from "@/components/mbole-logo"

const steps = [
  { title: "Name your Njangi", description: "Spin up a group with cycle frequency, amount, and invite code in seconds." },
  { title: "Invite trusted members", description: "Share the unique code and assign roles for admin, treasurer, and members." },
  { title: "Automate contributions", description: "Track payments, payouts, and disputes from a single transparent ledger." },
]

export default function SignUpPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md space-y-8">
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
              Already have access? <Link href="/signin" className="font-semibold text-primary">Sign in</Link>.
            </p>
          </div>
          <AuthForm mode="signup" className="bg-card p-6 shadow-sm rounded-2xl border" />
          <p className="text-center text-xs text-muted-foreground">
            We'll only use your details to manage your Njangi account. No spam, ever.
          </p>
        </div>
      </section>
      <aside className="relative hidden bg-muted lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary to-green-700" />
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
            <h3 className="text-3xl font-semibold leading-tight">
              Grow contributions without spreadsheets.
            </h3>
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
  )
}


