"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useGroups } from "@/hooks/use-groups"
import { Loader2, Plus, ArrowLeft } from "lucide-react"

export function CreateGroupPage() {
  const { toast } = useToast()
  const { createGroup } = useGroups()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contributionAmount: "5000",
    frequency: "MONTHLY",
    cycleType: "ROTATING",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Group name is required", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const group = await createGroup({
        name: formData.name.trim(),
        description: formData.description.trim(),
        contributionAmount: parseInt(formData.contributionAmount),
        frequency: formData.frequency,
        cycleType: formData.cycleType,
      })
      toast({ title: "Success", description: "Group created" })
      // return to the groups page so the new group appears in the list
      router.push('/groups')
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to create group", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
        <Button variant="ghost" onClick={() => router.back()} className="-ml-2 mr-2 p-1">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Plus className="h-5 w-5" /> Create a New Savings Group
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-lg">
        <div className="space-y-2">
          <Label htmlFor="name">Group Name *</Label>
          <Input id="name" name="name" placeholder="e.g., Family Savings Group" value={formData.name} onChange={handleChange} disabled={loading} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" placeholder="Optional" value={formData.description} onChange={handleChange} disabled={loading} rows={3} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monthly Amount (XAF) *</Label>
            <Input id="amount" name="contributionAmount" type="number" placeholder="5000" value={formData.contributionAmount} onChange={handleChange} disabled={loading} min="100" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency *</Label>
            <Select value={formData.frequency} onValueChange={(v) => handleSelectChange('frequency', v)}>
              <SelectTrigger id="frequency" disabled={loading}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cycleType">Payout Cycle *</Label>
          <Select value={formData.cycleType} onValueChange={(v) => handleSelectChange('cycleType', v)}>
            <SelectTrigger id="cycleType" disabled={loading}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ROTATING">Rotating</SelectItem>
              <SelectItem value="FIXED">Fixed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => router.push('/groups')} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateGroupPage
