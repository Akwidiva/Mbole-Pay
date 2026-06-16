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
import { Copy, Check, Loader2, Settings, ShieldCheck, ShieldX, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

interface GroupSettingsPageProps {
  groupId: string
  onGroupUpdated?: () => void
}

interface Group {
  id: string
  name: string
  description: string
  contributionAmount: number
  frequency: string
  cycleType: string
  payoutOrder: string
  minMembers: number
  maxMembers: number | null
  inviteCode: string
  status: string
  creatorId: string
  contractTxHash: string | null
  contractGroupId: string | null
}

export function GroupSettingsPage({ groupId, onGroupUpdated }: GroupSettingsPageProps) {
  const router = useRouter()
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [locking, setLocking] = useState(false)

  const copyField = (value: string, field: string) => {
    navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const deleteGroup = async () => {
    if (!confirm(`Delete "${group?.name}"? This cannot be undone and will remove all contribution history.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      toast({ title: "Group deleted" })
      router.push("/groups")
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to delete group", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  const lockOnChain = async () => {
    setLocking(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/lock-chain`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: "Locked on-chain", description: `Tx: ${data.txHash.slice(0, 18)}…` })
      fetchGroup()
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to lock on-chain", variant: "destructive" })
    } finally {
      setLocking(false)
    }
  }
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

      onGroupUpdated?.()
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
                <Badge variant="outline">{group.frequency}</Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Payout Cycle</p>
                <Badge variant="secondary">{group.cycleType}</Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Payout Order</p>
                <Badge variant="outline">{group.payoutOrder ?? "SEQUENTIAL"}</Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Min / Max Members</p>
                <p className="text-sm font-medium">
                  {group.minMembers} – {group.maxMembers ?? "∞"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={group.status === "ACTIVE" ? "default" : "destructive"}>{group.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blockchain Verification Card */}
        <Card className={group.contractTxHash ? "border-emerald-500/40" : "border-amber-400/40"}>
          <CardHeader>
            <div className="flex items-center gap-2">
              {group.contractTxHash
                ? <ShieldCheck className="h-5 w-5 text-emerald-500" />
                : <ShieldX className="h-5 w-5 text-amber-500" />}
              <CardTitle>Blockchain Verification</CardTitle>
            </div>
            <CardDescription>
              {group.contractTxHash
                ? "Group rules are permanently locked on-chain. Nobody can change them, not even the admin."
                : "Group rules have not been locked on-chain yet."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.contractTxHash ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Rules Locked
                  </Badge>
                </div>

                <div className="space-y-3 rounded-lg border border-border/60 divide-y text-sm">
                  {/* Transaction Hash */}
                  <div className="flex items-start justify-between gap-4 p-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">Transaction Hash</p>
                      <p className="font-mono text-xs break-all">{group.contractTxHash}</p>
                    </div>
                    <Button
                      type="button" size="icon" variant="ghost"
                      className="h-7 w-7 shrink-0"
                      onClick={() => copyField(group.contractTxHash!, "txHash")}
                    >
                      {copiedField === "txHash"
                        ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                        : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>

                  {/* On-chain Group ID */}
                  <div className="flex items-start justify-between gap-4 p-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">On-chain Group ID (bytes32)</p>
                      <p className="font-mono text-xs break-all">{group.contractGroupId}</p>
                    </div>
                    <Button
                      type="button" size="icon" variant="ghost"
                      className="h-7 w-7 shrink-0"
                      onClick={() => copyField(group.contractGroupId!, "groupId")}
                    >
                      {copiedField === "groupId"
                        ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                        : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>

                  {/* Contract Address */}
                  {process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS && (
                    <div className="flex items-start justify-between gap-4 p-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Factory Contract Address</p>
                        <p className="font-mono text-xs break-all">{process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS}</p>
                      </div>
                      <Button
                        type="button" size="icon" variant="ghost"
                        className="h-7 w-7 shrink-0"
                        onClick={() => copyField(process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS!, "contract")}
                      >
                        {copiedField === "contract"
                          ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                          : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Anyone can verify these rules are unchanged by querying the contract with the on-chain group ID above.
                </p>
              </>
            ) : (
              <>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-300">
                  Rules were not locked on-chain when this group was created. This may happen if the blockchain node was not running at creation time.
                </div>
                <Button onClick={lockOnChain} disabled={locking} className="gap-2">
                  {locking
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Locking on-chain…</>
                    : <><ShieldCheck className="h-4 w-4" /> Lock Rules On-Chain Now</>}
                </Button>
              </>
            )}
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
              Deleting a group will permanently remove it for all members along with all contribution history. This cannot be undone.
            </p>
            <Button variant="destructive" onClick={deleteGroup} disabled={deleting} className="gap-2">
              {deleting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</>
                : <><Trash2 className="h-4 w-4" /> Delete Group</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
