"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { GroupRole } from "@/types/roles"

/**
 * Hook to fetch and cache user's role in a specific group
 * Prevents repeated API calls by caching results
 */
export function useUserGroupRole(groupId: string | null) {
  const { data: session } = useSession()
  const [role, setRole] = useState<GroupRole | null>(null)
  const [loading, setLoading] = useState(!groupId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!groupId || !session?.user?.id) {
      setRole(null)
      setLoading(false)
      return
    }

    const fetchRole = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/auth/role?groupId=${groupId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch user role")
        }

        const data = await response.json()
        setRole(data.role || null)
      } catch (err) {
        console.error("Error fetching user role:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
        setRole(null)
      } finally {
        setLoading(false)
      }
    }

    fetchRole()
  }, [groupId, session?.user?.id])

  return { role, loading, error }
}

/**
 * Hook to check if user has specific permission in a group
 * Uses cached role to determine permissions
 */
export function useHasPermission(groupId: string | null, permission: string) {
  const { role } = useUserGroupRole(groupId)
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    if (!role) {
      setHasPermission(false)
      return
    }

    // Import RolePermissions to check permissions
    import("@/types/roles").then(({ RolePermissions }) => {
      const permissions = RolePermissions[role as GroupRole] || []
      setHasPermission(permissions.includes(permission as any))
    })
  }, [role, permission])

  return hasPermission
}

/**
 * Hook to check if user is admin in a specific group
 */
export function useIsGroupAdmin(groupId: string | null) {
  const { role } = useUserGroupRole(groupId)
  return role === GroupRole.ADMIN
}

