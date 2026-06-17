"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, User, Phone, Mail, ShieldCheck, Save, Loader2 } from "lucide-react"
import Link from "next/link"

interface Profile {
  id: string
  name: string | null
  email: string
  phone: string | null
  image: string | null
  kycStatus: string
  createdAt: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/signin"); return }
    if (status === "authenticated") fetchProfile()
  }, [status])

  async function fetchProfile() {
    try {
      const res = await fetch("/api/user/profile")
      if (!res.ok) return
      const json = await res.json()
      setProfile(json.data)
      setName(json.data.name || "")
      setPhone(json.data.phone || "")
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast({ title: "Error", description: json.error, variant: "destructive" })
        return
      }
      setProfile(json.data)
      toast({ title: "Profile updated", description: "Your changes have been saved." })
    } finally {
      setSaving(false)
    }
  }

  const initials = (profile?.name || profile?.email || "U")
    .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)

  const kycColor: Record<string, string> = {
    NONE: "secondary",
    PENDING: "outline",
    APPROVED: "default",
    REJECTED: "destructive",
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">My Profile</h1>
        </div>

        {/* Avatar + summary */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="pt-6 flex items-center gap-5">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-xl font-semibold">{profile?.name || "No name set"}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <div className="flex items-center gap-2">
                <Badge variant={kycColor[profile?.kycStatus || "NONE"] as any}>
                  KYC: {profile?.kycStatus || "NONE"}
                </Badge>
                {profile?.phone && (
                  <Badge variant="outline" className="font-mono">{profile.phone}</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit form */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Your MTN MoMo number is used for automatic payments — keep it up to date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-5">

              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Full Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </Label>
                <Input
                  id="email"
                  value={profile?.email || ""}
                  disabled
                  className="opacity-60"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> MTN MoMo Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                />
                <p className="text-xs text-muted-foreground">
                  This is the number that receives the USSD payment prompt when you click "Pay Now" in a group.
                </p>
              </div>

              <div className="pt-1 flex items-center gap-2">
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>

        {/* KYC status card */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Identity Verification (KYC)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={kycColor[profile?.kycStatus || "NONE"] as any}>
                {profile?.kycStatus || "NONE"}
              </Badge>
            </div>
            {profile?.kycStatus === "NONE" && (
              <Link href="/kyc">
                <Button variant="outline" className="w-full mt-2">Complete Identity Verification</Button>
              </Link>
            )}
            {profile?.kycStatus === "REJECTED" && (
              <Link href="/kyc">
                <Button variant="destructive" className="w-full mt-2">Re-submit KYC Documents</Button>
              </Link>
            )}
            {profile?.kycStatus === "APPROVED" && (
              <p className="text-sm text-green-600 font-medium">Your identity has been verified.</p>
            )}
            {profile?.kycStatus === "PENDING" && (
              <p className="text-sm text-amber-600">Your documents are under review.</p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
