"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { itemVariants } from "@/lib/animations"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Trash2, UserCog } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Member {
  userId: string
  user: {
    id: string
    name: string
    email: string
  }
  role: "ADMIN" | "TREASURER" | "MEMBER"
  joinedAt?: string
}

interface MemberManagementProps {
  groupId: string
  currentUserRole: "ADMIN" | "TREASURER" | "MEMBER"
}

export function MemberManagement({ groupId, currentUserRole }: MemberManagementProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingMember, setUpdatingMember] = useState<string | null>(null)
  const [removingMember, setRemovingMember] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const { toast } = useToast()

  const canManageMembers = currentUserRole === "ADMIN"

  useEffect(() => {
    fetchMembers()
  }, [groupId])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/groups/${groupId}/members`)

      if (!response.ok) {
        throw new Error("Failed to fetch members")
      }

      const data = await response.json()
      setMembers(data.members || [])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load members",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: "ADMIN" | "TREASURER" | "MEMBER") => {
    try {
      setUpdatingMember(userId)
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          role: newRole,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update member role")
      }

      setMembers(members.map(m => (m.userId === userId ? { ...m, role: newRole } : m)))

      toast({
        title: "Success",
        description: `Role updated to ${newRole}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      })
    } finally {
      setUpdatingMember(null)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      setRemovingMember(userId)
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove member")
      }

      setMembers(members.filter(m => m.userId !== userId))

      toast({
        title: "Success",
        description: "Member removed from group",
      })

      setShowRemoveConfirm(false)
      setSelectedMember(null)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove member",
        variant: "destructive",
      })
    } finally {
      setRemovingMember(null)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive"
      case "TREASURER":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Group Members</CardTitle>
          <CardDescription>Manage group members and their roles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCog className="mr-2 h-5 w-5" />
            Group Members ({members.length})
          </CardTitle>
          <CardDescription>
            {canManageMembers ? "Click roles to change member permissions" : "View group members and their roles"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No members yet</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => {
                return (
                  <div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                        <AvatarFallback>
                          {(member.user.name || member.user.email).substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{member.user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {canManageMembers ? (
                        <>
                          <Select
                            value={member.role}
                            onValueChange={(value) =>
                              handleUpdateRole(member.userId, value as "ADMIN" | "TREASURER" | "MEMBER")
                            }
                            disabled={updatingMember === member.userId}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MEMBER">Member</SelectItem>
                              <SelectItem value="TREASURER">Treasurer</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member)
                              setShowRemoveConfirm(true)
                            }}
                            disabled={removingMember === member.userId}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {removingMember === member.userId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      ) : (
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {member.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedMember?.user.name} from this group? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end space-x-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedMember) {
                  handleRemoveMember(selectedMember.userId)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
