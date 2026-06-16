"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useGroups } from "@/hooks/use-groups"
import { Loader2, Plus } from "lucide-react"

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateGroupDialog({ open, onOpenChange, onSuccess }: CreateGroupDialogProps) {
  const { toast } = useToast()
  const { createGroup } = useGroups()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contributionAmount: "5000",
    frequency: "MONTHLY",
    cycleType: "ROTATING",
    payoutOrder: "SEQUENTIAL",
    minMembers: "2",
    maxMembers: "",
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      })
      return
    }

    if (parseInt(formData.contributionAmount) < 100) {
      toast({
        title: "Error",
        description: "Contribution amount must be at least XAF 100",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const minMembers = parseInt(formData.minMembers) || 2
      const maxMembers = formData.maxMembers ? parseInt(formData.maxMembers) : null

      if (maxMembers !== null && maxMembers <= minMembers) {
        toast({ title: "Error", description: "Maximum members must be greater than minimum members", variant: "destructive" })
        setLoading(false)
        return
      }

      await createGroup({
        name: formData.name.trim(),
        description: formData.description.trim(),
        contributionAmount: parseInt(formData.contributionAmount),
        frequency: formData.frequency,
        cycleType: formData.cycleType,
        payoutOrder: formData.payoutOrder,
        minMembers,
        maxMembers,
      })

      toast({
        title: "Success!",
        description: "Group created successfully. Share the invite code with members.",
      })

      setFormData({
        name: "",
        description: "",
        contributionAmount: "5000",
        frequency: "MONTHLY",
        cycleType: "ROTATING",
        payoutOrder: "SEQUENTIAL",
        minMembers: "2",
        maxMembers: "",
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create group",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            Create a New Savings Group
          </DialogTitle>
          <DialogDescription>
            Set up a new savings group and invite members. You'll get an invite code to share.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Family Savings Group"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What is this group for? (optional)"
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Contribution Amount (XAF) *</Label>
              <Input
                id="amount"
                name="contributionAmount"
                type="number"
                placeholder="5000"
                value={formData.contributionAmount}
                onChange={handleChange}
                disabled={loading}
                min="100"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Select value={formData.frequency} onValueChange={(value) => handleSelectChange("frequency", value)}>
                <SelectTrigger id="frequency" disabled={loading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="BIWEEKLY">Fortnightly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cycleType">Payout Cycle *</Label>
              <Select value={formData.cycleType} onValueChange={(value) => handleSelectChange("cycleType", value)}>
                <SelectTrigger id="cycleType" disabled={loading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROTATING">Rotating (everyone takes turns)</SelectItem>
                  <SelectItem value="FIXED">Fixed (same recipient always)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payoutOrder">Payout Order *</Label>
              <Select value={formData.payoutOrder} onValueChange={(value) => handleSelectChange("payoutOrder", value)}>
                <SelectTrigger id="payoutOrder" disabled={loading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEQUENTIAL">Sequential (fixed queue)</SelectItem>
                  <SelectItem value="LOTTERY">Lottery (random draw)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minMembers">Min Members *</Label>
              <Input
                id="minMembers"
                name="minMembers"
                type="number"
                placeholder="2"
                value={formData.minMembers}
                onChange={handleChange}
                disabled={loading}
                min="2"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxMembers">Max Members <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="maxMembers"
                name="maxMembers"
                type="number"
                placeholder="No limit"
                value={formData.maxMembers}
                onChange={handleChange}
                disabled={loading}
                min={String(parseInt(formData.minMembers || "2") + 1)}
              />
            </div>
          </div>

          <div className="bg-muted p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">Group rules are locked after creation</p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>• You'll be the admin with full control</li>
              <li>• Share the invite code to add members</li>
              <li>• Each member contributes {formData.contributionAmount} XAF · {formData.frequency.toLowerCase()} · {formData.payoutOrder.toLowerCase()} payout order</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
