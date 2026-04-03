"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Settings, Trash2, Edit2 } from "lucide-react"
import { motion } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUserGroupRole, useIsGroupAdmin } from "@/hooks/use-group-role"
import { RoleBadge } from "./role-badge"
import { PermissionGate } from "./permission-gates"

interface GroupCardProps {
  group: any
  onViewDetails: (groupId: string) => void
  onEdit: (groupId: string) => void
  onDelete: (groupId: string) => void
}

/**
 * Enhanced group card with RBAC-based actions
 */
export function GroupCardWithRBAC({
  group,
  onViewDetails,
  onEdit,
  onDelete,
}: GroupCardProps) {
  const { role, loading } = useUserGroupRole(group.id)
  const isAdmin = useIsGroupAdmin(group.id)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CM", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="border border-secondary/20 shadow-md hover:border-secondary/40 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12 border-2 border-secondary/30">
                <AvatarImage
                  src={`/placeholder.svg?height=48&width=48`}
                  alt={group.name}
                />
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  {group.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-xl">{group.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  {group._count?.memberships || 0} members
                  {!loading && role && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <RoleBadge role={role} />
                    </>
                  )}
                </CardDescription>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button variant="ghost" size="icon" disabled={loading}>
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">More options</span>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onViewDetails(group.id)}>
                  View Details
                </DropdownMenuItem>

                <PermissionGate
                  permission="contributions:view"
                  groupId={group.id}
                  fallback={null}
                >
                  <DropdownMenuItem onClick={() => onViewDetails(group.id)}>
                    View Contributions
                  </DropdownMenuItem>
                </PermissionGate>

                <PermissionGate
                  permission="members:view"
                  groupId={group.id}
                  fallback={null}
                >
                  <DropdownMenuItem onClick={() => onViewDetails(group.id)}>
                    View Members
                  </DropdownMenuItem>
                </PermissionGate>

                <DropdownMenuSeparator />

                <PermissionGate
                  permission="group:edit"
                  groupId={group.id}
                  fallback={null}
                >
                  <DropdownMenuItem onClick={() => onEdit(group.id)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit Group
                  </DropdownMenuItem>
                </PermissionGate>

                <PermissionGate
                  permission="group:delete"
                  groupId={group.id}
                  fallback={null}
                >
                  <DropdownMenuItem
                    onClick={() => onDelete(group.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Group
                  </DropdownMenuItem>
                </PermissionGate>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Contribution:</span>
                <span className="text-sm font-medium">
                  {formatCurrency(group.contributionAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Frequency:</span>
                <span className="text-sm font-medium capitalize">
                  {group.frequency.toLowerCase()}
                </span>
              </div>
            </div>

            <PermissionGate
              permission="reports:view"
              groupId={group.id}
              fallback={null}
            >
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Reports:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => onViewDetails(group.id)}
                  >
                    View
                  </Button>
                </div>
              </div>
            </PermissionGate>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
