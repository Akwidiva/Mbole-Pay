"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function InvitationPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [accepting, setAccepting] = useState(false)

  const token = params?.token as string

  const handleAccept = async () => {
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
      router.push(`/groups/${data.group?.id || ""}`)
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

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Group Invitation</CardTitle>
          <CardDescription>
            {status === "authenticated"
              ? `Signed in as ${session.user?.email}. Accept the invitation to join the group.`
              : "Sign in with the invited email address before accepting this invitation."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This invitation must be accepted before you are added to the group.
          </p>
          <Button onClick={handleAccept} disabled={accepting || status !== "authenticated"} className="w-full">
            {accepting ? "Accepting..." : "Accept Invitation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
