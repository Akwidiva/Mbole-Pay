"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Mail, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MboleLogo } from "@/components/mbole-logo"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()

    const subject = encodeURIComponent("Mbole Pay password reset request")
    const body = encodeURIComponent(
      `Please help me reset my Mbole Pay password.\n\nEmail: ${email || "[your email]"}\n\nThank you.`,
    )

    window.location.href = `mailto:support@mbolepay.com?subject=${subject}&body=${body}`
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(30,64,175,0.52),transparent_35%),radial-gradient(circle_at_84%_30%,rgba(16,185,129,0.4),transparent_30%),radial-gradient(circle_at_62%_82%,rgba(6,182,212,0.35),transparent_35%)]" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1fr_1fr] blur-[1.5px] scale-[1.01]">
        <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-md space-y-7 opacity-70">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Sparkles className="mr-2 h-3 w-3" /> Password Recovery
            </div>
            <h1 className="text-3xl font-bold">Recover your account access</h1>
            <p className="text-sm text-muted-foreground">
              Request a password reset and continue managing your savings and contributions securely.
            </p>
          </div>
        </section>
        <aside className="hidden lg:block" />
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
            href="/signin"
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground transition hover:text-foreground"
            aria-label="Close forgot password modal"
          >
            <X className="h-4 w-4" />
          </Link>

          <Link href="/signin" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to sign in
          </Link>

          <div className="mt-5 mb-4 flex items-center gap-3">
            <MboleLogo className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-primary">Mbole</span>
                <span className="text-secondary"> Pay</span>
              </h1>
              <p className="text-xs text-muted-foreground">Forgot Password</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold">Reset your password</h2>
          <p className="mt-2 text-sm text-muted-foreground">Enter your email and we&apos;ll open a reset request pre-filled for support.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Send reset request
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
