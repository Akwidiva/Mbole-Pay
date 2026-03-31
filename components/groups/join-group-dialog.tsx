"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface JoinGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinGroupDialog({ open, onOpenChange }: JoinGroupDialogProps) {
  const [inviteCode, setInviteCode] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inviteCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invite code",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/groups/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteCode: inviteCode.trim().toUpperCase(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to join group")
      }

      toast({
        title: "Success!",
        description: data.message || `You've successfully joined the group!`,
      })

      setInviteCode("")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join group",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join a Savings Group</DialogTitle>
          <DialogDescription>
            Enter the invite code provided by the group administrator to join.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite Code</Label>
            <Input
              id="invite-code"
              placeholder="e.g., ABC123XYZ"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              disabled={loading}
              className="uppercase"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              You can find this code in the group invitation link or from the group admin.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Joining..." : "Join Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
