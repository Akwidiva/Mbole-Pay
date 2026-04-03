"use client"

import { useCallback } from "react"
import { useSession } from "next-auth/react"
import { Permission, GroupRole } from "@/types/roles"

/**
 * Hook to check user permissions in a specific group
 * Fetches role from backend and validates permissions locally
 */
export function usePermission() {
  const { data: session } = useSession()

  const checkPermission = useCallback(
    async (groupId: string, permission: Permission): Promise<boolean> => {
      if (!session?.user?.id) return false

      try {
        const response = await fetch(
          `/api/auth/permission?groupId=${groupId}&permission=${permission}`,
          { method: "GET" }
        )

        if (!response.ok) return false

        const data = await response.json()
        return data.hasPermission === true
      } catch (error) {
        console.error("Permission check error:", error)
        return false
      }
    },
    [session?.user?.id]
  )

  const getUserRole = useCallback(
    async (groupId: string): Promise<GroupRole | null> => {
      if (!session?.user?.id) return null

      try {
        const response = await fetch(
          `/api/auth/role?groupId=${groupId}`,
          { method: "GET" }
        )

        if (!response.ok) return null

        const data = await response.json()
        return data.role || null
      } catch (error) {
        console.error("Role fetch error:", error)
        return null
      }
    },
    [session?.user?.id]
  )

  return { checkPermission, getUserRole }
}
