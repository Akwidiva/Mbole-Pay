"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Copy, Check, Loader2, Settings } from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

interface GroupSettingsPageProps {
  groupId: string
}

interface Group {
  id: string
  name: string
  description: string
  contributionAmount: number
  frequency: string
  cycleType: string
  inviteCode: string
  status: string
  creatorId: string
}

export function GroupSettingsPage({ groupId }: GroupSettingsPageProps) {
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [formData, setFormData] = useState({ name: "", description: "" })
  const { toast } = useToast()

  useEffect(() => {
    fetchGroup()
  }, [groupId])

  const fetchGroup = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/groups/${groupId}`)
      if (!response.ok) throw new Error("Failed to fetch group")
      const data = await response.json()
      setGroup(data.group || data.data)
      setFormData({
        name: (data.group || data.data).name,
        description: (data.group || data.data).description,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load group",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
        }),
      })

      if (!response.ok) throw new Error("Failed to update group")

      const data = await response.json()
      setGroup(data.group)

      toast({
        title: "Success",
        description: "Group settings updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update group",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const copyInviteCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      })
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    try {
      setInviting(true)
      const response = await fetch(`/api/groups/${groupId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to send invite")
      }

      toast({
        title: "Invitation sent",
        description: `Pending acceptance for ${inviteEmail.trim()}`,
      })
      setInviteEmail("")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive",
      })
    } finally {
      setInviting(false)
    }
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardShell>
    )
  }

  if (!group) {
    return (
      <DashboardShell>
        <Card>
          <CardContent className="pt-8">
            <p className="text-center text-muted-foreground">Group not found</p>
          </CardContent>
        </Card>
      </DashboardShell>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CM", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Settings className="mr-2 h-8 w-8" />
            Group Settings
          </h1>
        </div>

        {/* Group Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Group Information</CardTitle>
            <CardDescription>Edit group name and description</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateGroup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={saving}
                  placeholder="Group name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={saving}
                  placeholder="Group description"
                  rows={4}
                />
              </div>

              <Button type="submit" disabled={saving || (formData.name === group.name && formData.description === group.description)}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Invite Code Card */}
        <Card>
          <CardHeader>
            <CardTitle>Invite Members</CardTitle>
            <CardDescription>Send an email invite. They must accept before they are added to the group.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Invite by Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="person@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={inviting}
                />
              </div>
              <Button type="submit" disabled={inviting}>
                {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {inviting ? "Sending..." : "Send Invitation"}
              </Button>
            </form>

            <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
              <code className="text-sm font-mono font-bold flex-1">{group.inviteCode}</code>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={copyInviteCode}
                className="flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              📋 Share this invite code or send an email invite. Email invites stay pending until accepted.
            </p>
          </CardContent>
        </Card>

        {/* Group Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Group Configuration</CardTitle>
            <CardDescription>Contribution rules and cycle settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Contribution Amount</p>
                <p className="text-lg font-bold">{formatCurrency(group.contributionAmount)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Frequency</p>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{group.frequency}</Badge>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Payout Cycle</p>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{group.cycleType}</Badge>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={group.status === "ACTIVE" ? "default" : "destructive"}>{group.status}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Actions that cannot be undone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Deleting a group will remove it for all members. All contribution history will be archived but inaccessible.
            </p>
            <Button variant="destructive" disabled>
              Delete Group (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
