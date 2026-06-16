"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useGroups } from "@/hooks/use-groups"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink, Loader2, Mail, Users, Copy, ChevronLeft } from "lucide-react"

export function InviteMembersPage() { // fixed: visibleGroups hoisted before useEffect
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { groups, loading } = useGroups()
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [inviteUrl, setInviteUrl] = useState("")
  const [inviteEmailAddress, setInviteEmailAddress] = useState("")

  const visibleGroups = useMemo(() => groups.filter((group) => group.status !== "INACTIVE"), [groups])
  const selectedGroup = useMemo(() => visibleGroups.find((group) => group.id === selectedGroupId), [visibleGroups, selectedGroupId])

  useEffect(() => {
    const groupIdFromQuery = searchParams.get("groupId") || ""
    if (groupIdFromQuery) {
      setSelectedGroupId(groupIdFromQuery)
      return
    }

    if (!selectedGroupId && visibleGroups.length > 0) {
      setSelectedGroupId(visibleGroups[0].id)
    }
  }, [searchParams, selectedGroupId, visibleGroups])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!selectedGroupId) {
      toast({
        title: "No group selected",
        description: "Choose a group before sending an invitation.",
        variant: "destructive",
      })
      return
    }

    if (!inviteEmail.trim()) {
      toast({
        title: "Email required",
        description: "Enter the email address of the person you want to invite.",
        variant: "destructive",
      })
      return
    }

    try {
      setSending(true)
      const response = await fetch(`/api/groups/${selectedGroupId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation")
      }

      const acceptUrl = data.acceptUrl
        ? `${window.location.origin}${data.acceptUrl}`
        : ""

      const invitedEmail = inviteEmail.trim()

      setInviteUrl(acceptUrl)
      setInviteEmailAddress(invitedEmail)
      setInviteEmail("")

      toast({
        title: "Invitation sent",
        description: `${invitedEmail} can now accept the invite link.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const copyInviteLink = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    toast({ title: "Copied", description: "Invite link copied to clipboard." })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  if (!visibleGroups.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invite Members</CardTitle>
          <CardDescription>You need at least one group before you can invite anyone.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/groups">
            <Button variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Groups
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Mail className="h-8 w-8" />
            Invite Members
          </h1>
          <p className="text-muted-foreground">Send an email invite link and let the member join after signing in or signing up.</p>
        </div>
        <Link href="/groups">
          <Button variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Groups
          </Button>
        </Link>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Invite by Email</CardTitle>
          <CardDescription>Choose a group, enter an email address, then we will email a secure join link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="group">Group</Label>
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger id="group">
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Invite Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="member@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={sending}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={sending || !selectedGroupId}>
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {sending ? "Sending..." : "Send Invitation"}
              </Button>

              {selectedGroup && (
                <Button asChild type="button" variant="outline">
                  <Link href={`/groups/${selectedGroup.id}?tab=settings`}>
                    <Users className="mr-2 h-4 w-4" />
                    Manage Group
                  </Link>
                </Button>
              )}
            </div>
          </form>

          {inviteUrl && (
            <div className="mt-6 rounded-2xl border bg-muted/30 p-4">
              <p className="text-sm font-medium">Invite link for {inviteEmailAddress}</p>
              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                <code className="flex-1 rounded-lg bg-background px-3 py-2 text-xs break-all">{inviteUrl}</code>
                <Button type="button" variant="outline" onClick={copyInviteLink}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
                <Button asChild type="button">
                  <Link href={inviteUrl} target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default InviteMembersPage