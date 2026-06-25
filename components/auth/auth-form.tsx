"use client"

import { useState } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { KycUpload } from "@/components/auth/kyc-upload"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { containerVariants, itemVariants } from "@/lib/animations"
import { ShieldCheck, Mail } from "lucide-react"

interface AuthFormProps {
  mode: "signin" | "signup"
  redirectPath?: string
  onSuccess?: () => void
  className?: string
}

export function AuthForm({ mode, redirectPath = "/dashboard", onSuccess, className }: AuthFormProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // MFA state (login)
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaCode, setMfaCode] = useState("")
  const [mfaLoading, setMfaLoading] = useState(false)

  // Email verification state (signup)
  const [verifyingEmail, setVerifyingEmail] = useState(false)
  const [verifyCode, setVerifyCode] = useState("")
  const [verifyLoading, setVerifyLoading] = useState(false)

  // KYC upload state (signup — shown after email verified)
  const [uploadingKyc, setUploadingKyc] = useState(false)

  const finish = () => {
    if (redirectPath) window.location.assign(redirectPath)
    onSuccess?.()
  }

  const finishWithRoleRedirect = async () => {
    try {
      const sessionResponse = await fetch("/api/auth/session")
      const session = await sessionResponse.json().catch(() => null)
      const targetPath = (session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN") ? "/admin" : redirectPath
      window.location.assign(targetPath)
    } catch {
      finish()
    }
    onSuccess?.()
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim() || !phone.trim() || !email.trim() || password.length < 6 || password !== confirmPassword) {
      setError("Please fill in your name, MTN MoMo number, email, and password correctly")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Signup failed" }))
        throw new Error(data.error || "Signup failed")
      }

      // Send email verification OTP
      await fetch("/api/auth/verify-email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      toast.success("Account created! Check your email for a verification code.")
      setVerifyingEmail(true)
    } catch (err: any) {
      setError(err.message || "Error")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (verifyCode.length !== 6) {
      setError("Enter the 6-digit code from your email")
      return
    }

    setVerifyLoading(true)
    try {
      const res = await fetch("/api/auth/verify-email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verifyCode }),
      })

      const data = await res.json()

      if (!res.ok || !data.verified) {
        setError(data.error || "Invalid code. Try again.")
        setVerifyCode("")
        return
      }

      // Sign in so the KYC submit route has a session
      const signInResult = await signIn("credentials", { email, password, redirect: false })
      if (!signInResult?.ok) {
        setError("Email verified but sign-in failed. Please sign in manually.")
        setVerifyingEmail(false)
        return
      }

      toast.success("Email verified! Now upload your ID documents.")
      setVerifyingEmail(false)
      setVerifyCode("")
      setUploadingKyc(true)
    } catch (err: any) {
      setError(err.message || "Verification failed")
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.trim() || !password.trim()) {
      setError("Email and password required")
      return
    }

    setLoading(true)
    try {
      // Step 1: check if MFA is required for this account
      const mfaRes = await fetch("/api/auth/mfa/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const mfaData = await mfaRes.json()

      if (!mfaRes.ok) {
        setError(mfaData.error || "Invalid email or password")
        return
      }

      if (mfaData.mfaRequired) {
        // Step 2: show OTP input — password stays in state for later use
        setMfaRequired(true)
        toast.success("Code sent to your email")
        return
      }

      // No MFA needed — sign in directly
      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) {
        setError("Invalid email or password")
      } else if (result?.ok) {
        toast.success("Signed in!")
        await finishWithRoleRedirect()
      }
    } catch (err: any) {
      setError(err.message || "Signin failed")
    } finally {
      setLoading(false)
    }
  }

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (mfaCode.length !== 6) {
      setError("Enter the 6-digit code from your email")
      return
    }

    setMfaLoading(true)
    try {
      // Step 3: verify OTP
      const verifyRes = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: mfaCode }),
      })

      const verifyData = await verifyRes.json()

      if (!verifyRes.ok || !verifyData.verified) {
        setError(verifyData.error || "Invalid code. Try again.")
        setMfaCode("")
        return
      }

      // Step 4: OTP verified — create NextAuth session
      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) {
        setError("Sign in failed. Please start over.")
        setMfaRequired(false)
        setMfaCode("")
      } else if (result?.ok) {
        toast.success("Signed in!")
        await finishWithRoleRedirect()
      }
    } catch (err: any) {
      setError(err.message || "Verification failed")
    } finally {
      setMfaLoading(false)
    }
  }

  // Email verification screen (shown after signup)
  if (verifyingEmail) {
    return (
      <div className={cn("space-y-4", className)}>
        <AnimatePresence mode="wait">
          <motion.div
            key="verify-email"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                <Mail className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold">Verify your email</h3>
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>

            {error && (
              <div className="rounded bg-red-100 p-3 text-center text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailVerify} className="space-y-5">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={verifyLoading}
                placeholder="000000"
                className="text-center text-2xl font-bold tracking-[0.5em] h-14"
                autoFocus
              />

              <Button
                type="submit"
                className="w-full"
                disabled={verifyLoading || verifyCode.length !== 6}
              >
                {verifyLoading ? "Verifying..." : "Verify & Continue"}
              </Button>
            </form>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => { setVerifyingEmail(false); setVerifyCode(""); setError("") }}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setError("")
                  setVerifyCode("")
                  setLoading(true)
                  try {
                    await fetch("/api/auth/verify-email/send", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email }),
                    })
                    toast.success("New code sent")
                  } finally {
                    setLoading(false)
                  }
                }}
                className="flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
              >
                <Mail className="h-3.5 w-3.5" />
                Resend code
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // KYC document upload screen (shown after email verification at signup)
  if (uploadingKyc) {
    return (
      <div className={cn("space-y-4", className)}>
        <KycUpload
          onSuccess={() => {
            // Already signed in after email verification — just proceed
            finish()
          }}
        />
      </div>
    )
  }

  // MFA challenge screen
  if (mfaRequired) {
    return (
      <div className={cn("space-y-4", className)}>
        <AnimatePresence mode="wait">
          <motion.div
            key="mfa"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Verify your identity</h3>
              <p className="text-sm text-muted-foreground">
                A 6-digit code was sent to{" "}
                <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>

            {error && (
              <div className="rounded bg-red-100 p-3 text-center text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleMfaVerify} className="space-y-5">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={mfaLoading}
                placeholder="000000"
                className="text-center text-2xl font-bold tracking-[0.5em] h-14"
                autoFocus
              />

              <Button type="submit" className="w-full" disabled={mfaLoading || mfaCode.length !== 6}>
                {mfaLoading ? "Verifying..." : "Verify & Sign In"}
              </Button>
            </form>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => { setMfaRequired(false); setMfaCode(""); setError("") }}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setError("")
                  setMfaCode("")
                  setLoading(true)
                  try {
                    await fetch("/api/auth/mfa/initiate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email, password }),
                    })
                    toast.success("New code sent")
                  } finally {
                    setLoading(false)
                  }
                }}
                className="flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
              >
                <Mail className="h-3.5 w-3.5" />
                Resend code
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // Normal sign-in / sign-up form
  return (
    <div className={cn("space-y-4", className)}>
      <motion.form
        onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
        className="space-y-4"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {error && (
          <motion.div variants={itemVariants} className="rounded bg-red-100 p-3 text-sm text-red-700">
            {error}
          </motion.div>
        )}

        {mode === "signup" && (
          <motion.div variants={itemVariants}>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
          </motion.div>
        )}

        {mode === "signup" && (
          <motion.div variants={itemVariants}>
            <Label htmlFor="phone">MTN MoMo Number</Label>
            <Input
              id="phone"
              type="text"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+237 6XX XXX XXX"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              This number will be used for all your payments and payouts
            </p>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Label htmlFor="password">Password {mode === "signup" && "(6+ characters)"}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </motion.div>

        {mode === "signin" && (
          <motion.div variants={itemVariants} className="flex items-center justify-end">
            <Link href="/forgot-password" className="text-sm font-medium text-primary transition hover:text-primary/80">
              Forgot password?
            </Link>
          </motion.div>
        )}

        {mode === "signup" && (
          <motion.div variants={itemVariants}>
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? mode === "signin" ? "Checking..." : "Creating..."
              : mode === "signin" ? "Sign In" : "Sign Up"}
          </Button>
        </motion.div>
      </motion.form>

      <div>
        <Separator className="my-4" />
        <motion.div variants={itemVariants}>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: redirectPath })}
            disabled={loading}
          >
            Continue with Google
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
