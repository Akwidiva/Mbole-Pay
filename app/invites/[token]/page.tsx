"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { AuthForm } from "@/components/auth/auth-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function InvitationPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [accepting, setAccepting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [mode, setMode] = useState<"signin" | "signup">("signin")

  const token = params?.token as string

  const handleAccept = async () => {
    if (accepting || completed) {
      return
    }

    try {
      setAccepting(true)
      const response = await fetch(`/api/groups/invitations/${token}/accept`, {
        method: "POST",
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to accept invitation")
      }

      toast({
        title: "Invitation accepted",
        description: data.message || "You have joined the group.",
      })
      setCompleted(true)
      router.replace(`/groups/${data.group?.id || ""}`)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept invitation",
        variant: "destructive",
      })
    } finally {
      setAccepting(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated" && token && !completed) {
      void handleAccept()
    }
  }, [status, token, completed])

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Group Invitation</CardTitle>
          <CardDescription>
            {status === "authenticated"
              ? `Signed in as ${session.user?.email}. You will be added automatically.`
              : "Sign in or create the invited account, then we will add you automatically."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "authenticated" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This invitation is being accepted in the background.
              </p>
              <Button onClick={handleAccept} disabled={accepting || completed} className="w-full">
                {accepting ? "Accepting..." : completed ? "Accepted" : "Accept Invitation"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex gap-2">
                <Button type="button" variant={mode === "signin" ? "default" : "outline"} onClick={() => setMode("signin")} className="flex-1">
                  Sign In
                </Button>
                <Button type="button" variant={mode === "signup" ? "default" : "outline"} onClick={() => setMode("signup")} className="flex-1">
                  Sign Up
                </Button>
              </div>
              <AuthForm mode={mode} redirectPath={`/invites/${token}`} className="bg-muted/40 p-4 rounded-2xl border" />
              <p className="text-xs text-muted-foreground">
                Use the same email address that received the invitation link.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
