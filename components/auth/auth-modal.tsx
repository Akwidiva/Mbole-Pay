"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "signin" | "signup"
}

export function AuthModal({ open, onOpenChange, mode }: AuthModalProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
        const data = await res.json()
        throw new Error(data.error || "Signup failed")
      }
      
      toast.success("Account created! Signing in...")
      const result = await signIn("credentials", { email, password, redirect: false })
      
      if (result?.ok) {
        onOpenChange(false)
        router.push("/dashboard")
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
        onOpenChange(false)
        router.push("/dashboard")
      }
    } catch (err: any) {
      setError(err.message || "Signin failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === "signin" ? "Sign In" : "Sign Up"}</DialogTitle>
          <DialogDescription>
            {mode === "signin"
              ? "Enter your email and password or continue with Google to access your account."
              : "Provide your details to create a new Mbole Pay account."}
          </DialogDescription>
        </DialogHeader>

        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            {error && <div className="bg-red-100 text-red-700 p-3 rounded text-sm">{error}</div>}
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <Separator />
            <Button type="button" variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl: "/dashboard" })} disabled={loading}>
              Sign in with Google
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            {error && <div className="bg-red-100 text-red-700 p-3 rounded text-sm">{error}</div>}
            <div>
              <Label>Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
            </div>
            <div>
              <Label>Password (6+ characters)</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Sign Up"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
