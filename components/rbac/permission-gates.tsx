"use client"

import { ReactNode } from "react"
import { Permission, GroupRole, RolePermissions } from "@/types/roles"
import { useHasPermission, useIsGroupAdmin, useUserGroupRole } from "@/hooks/use-group-role"

interface PermissionGateProps {
  children: ReactNode
  permission: Permission
  groupId: string | null
  fallback?: ReactNode
}

/**
 * Component that renders children only if user has specific permission
 */
export function PermissionGate({
  children,
  permission,
  groupId,
  fallback = null,
}: PermissionGateProps) {
  const hasPermission = useHasPermission(groupId, permission)

  return hasPermission ? children : fallback
}

interface RoleGateProps {
  children: ReactNode
  role: GroupRole | GroupRole[]
  groupId: string | null
  fallback?: ReactNode
}

/**
 * Component that renders children only if user has specific role(s)
 */
export function RoleGate({
  children,
  role,
  groupId,
  fallback = null,
}: RoleGateProps) {
  const { role: userRole } = useUserGroupRole(groupId)

  if (!userRole) return fallback

  const roles = Array.isArray(role) ? role : [role]
  const hasRole = roles.includes(userRole as GroupRole)

  return hasRole ? children : fallback
}

interface AdminGateProps {
  children: ReactNode
  groupId: string | null
  fallback?: ReactNode
}

/**
 * Component that renders children only if user is admin in group
 */
export function AdminGate({ children, groupId, fallback = null }: AdminGateProps) {
  const isAdmin = useIsGroupAdmin(groupId)
  return isAdmin ? children : fallback
}

interface ConditionalRenderProps {
  children: ReactNode
  permission?: Permission
  role?: GroupRole | GroupRole[]
  groupId: string | null
  fallback?: ReactNode
}

/**
 * Flexible component that supports both permission and role checks
 */
export function ConditionalRender({
  children,
  permission,
  role,
  groupId,
  fallback = null,
}: ConditionalRenderProps) {
  if (permission) {
    return (
      <PermissionGate permission={permission} groupId={groupId} fallback={fallback}>
        {children}
      </PermissionGate>
    )
  }

  if (role) {
    return (
      <RoleGate role={role} groupId={groupId} fallback={fallback}>
        {children}
      </RoleGate>
    )
  }

  return children
}
