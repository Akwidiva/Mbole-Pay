"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { containerVariants, itemVariants } from "@/lib/animations"

interface AuthFormProps {
  mode: "signin" | "signup"
  redirectPath?: string
  onSuccess?: () => void
  className?: string
}

export function AuthForm({ mode, redirectPath = "/dashboard", onSuccess, className }: AuthFormProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const finish = () => {
    if (redirectPath) {
      router.push(redirectPath)
    }
    onSuccess?.()
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim() || !email.trim() || password.length < 6 || password !== confirmPassword) {
      setError("Please fill in all fields correctly")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Signup failed" }))
        throw new Error(data.error || "Signup failed")
      }

      toast.success("Account created! Signing in...")
      const result = await signIn("credentials", { email, password, redirect: false })

      if (result?.ok) {
        finish()
      } else {
        setError("Signin failed after signup")
      }
    } catch (err: any) {
      setError(err.message || "Error")
    } finally {
      setLoading(false)
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
      const result = await signIn("credentials", { email, password, redirect: false })

      if (result?.error) {
        setError("Invalid email or password")
      } else if (result?.ok) {
        toast.success("Signed in!")
        finish()
      }
    } catch (err: any) {
      setError(err.message || "Signin failed")
    } finally {
      setLoading(false)
    }
  }

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
          <motion.div
            variants={itemVariants}
            className="bg-red-100 text-red-700 p-3 rounded text-sm"
          >
            {error}
          </motion.div>
        )}
        {mode === "signup" && (
          <motion.div variants={itemVariants}>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
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
            {loading ? (mode === "signin" ? "Signing in..." : "Creating...") : mode === "signin" ? "Sign In" : "Sign Up"}
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
