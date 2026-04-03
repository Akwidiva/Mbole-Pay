"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, UserX } from "lucide-react"
import { RoleBadge } from "./role-badge"
import { RoleSelect } from "./role-badge"
import { GroupRole } from "@/types/roles"
import { AdminGate } from "./permission-gates"

interface Member {
  id: string
  name: string
  email: string
  role: GroupRole
  image?: string
}

interface MemberManagementProps {
  groupId: string
  members: Member[]
  onRoleChange: (memberId: string, newRole: GroupRole) => Promise<void>
  onRemoveMember: (memberId: string) => Promise<void>
  currentUserId: string
}

/**
 * Component for managing group members (admin only)
 */
export function MemberManagement({
  groupId,
  members,
  onRoleChange,
  onRemoveMember,
  currentUserId,
}: MemberManagementProps) {
  const [updating, setUpdating] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const handleRoleChange = async (memberId: string, newRole: GroupRole) => {
    try {
      setUpdating(memberId)
      await onRoleChange(memberId, newRole)
    } finally {
      setUpdating(null)
    }
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return

    try {
      setRemoving(memberId)
      await onRemoveMember(memberId)
    } finally {
      setRemoving(null)
    }
  }

  return (
    <AdminGate groupId={groupId}>
      <Card>
        <CardHeader>
          <CardTitle>Member Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={member.image} alt={member.name} />
                    <AvatarFallback>
                      {member.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {member.id === currentUserId ? (
                    <RoleBadge role={member.role} variant="secondary" />
                  ) : (
                    <RoleSelect
                      value={member.role}
                      onChange={(newRole) => handleRoleChange(member.id, newRole)}
                      disabled={updating === member.id}
                    />
                  )}

                  {member.id !== currentUserId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(member.id)}
                      disabled={removing === member.id}
                    >
                      {removing === member.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserX className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AdminGate>
  )
}
