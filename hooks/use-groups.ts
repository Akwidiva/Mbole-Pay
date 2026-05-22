import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface Group {
  id: string
  name: string
  description: string
  contributionAmount: number
  frequency: string
  cycleType: string
  status: string
  createdAt: string
  creatorId: string
  _count?: {
    memberships: number
    contributions: number
  }
}

interface GroupStats {
  memberCount: number
  totalContributions: number
  pendingContributions: number
  overdueContributions: number
}

interface UseGroupsReturn {
  groups: Group[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createGroup: (data: Partial<Group>) => Promise<Group>
  updateGroup: (id: string, data: Partial<Group>) => Promise<Group>
  deleteGroup: (id: string) => Promise<void>
  getGroup: (id: string) => Promise<Group & { stats: GroupStats }>
}

export function useGroups(): UseGroupsReturn {
  const { data: session } = useSession()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!session?.user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/groups', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.details || `Failed to fetch groups: ${response.statusText}`
        )
      }

      const data = await response.json()
      setGroups(data.groups || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching groups:', err)
    } finally {
      setLoading(false)
    }
  }, [session?.user])

  const createGroup = useCallback(
    async (groupData: Partial<Group>): Promise<Group> => {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create group')
      }

      const data = await response.json()
      await refetch()
      return data.group
    },
    [refetch]
  )

  const updateGroup = useCallback(
    async (id: string, groupData: Partial<Group>): Promise<Group> => {
      const response = await fetch(`/api/groups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update group')
      }

      const data = await response.json()
      await refetch()
      return data.group
    },
    [refetch]
  )

  const deleteGroup = useCallback(
    async (id: string): Promise<void> => {
      const response = await fetch(`/api/groups/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete group')
      }

      await refetch()
    },
    [refetch]
  )

  const getGroup = useCallback(
    async (id: string): Promise<Group & { stats: GroupStats }> => {
      const response = await fetch(`/api/groups/${id}`)

      if (!response.ok) {
        throw new Error('Failed to fetch group details')
      }

      const data = await response.json()
      return data
    },
    []
  )

  useEffect(() => {
    refetch()
  }, [session?.user, refetch])

  return {
    groups,
    loading,
    error,
    refetch,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroup,
  }
}
