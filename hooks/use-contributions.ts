import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export interface Contribution {
  id: string
  amount: number
  status: 'PENDING' | 'PAID' | 'OVERDUE'
  dueDate: string
  paidAt: string | null
  createdAt: string
  userId: string
  groupId: string
  user?: {
    id: string
    name: string
    email: string
  }
  group?: {
    id: string
    name: string
  }
}

export interface ContributionStats {
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  overdueAmount: number
  totalCount: number
  paidCount: number
  pendingCount: number
  overdueCount: number
  completionRate: number
}

interface UseContributionsReturn {
  contributions: Contribution[]
  stats: ContributionStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createContribution: (data: Omit<Contribution, 'id' | 'createdAt' | 'paidAt' | 'user' | 'group'>) => Promise<Contribution>
  updateContributionStatus: (id: string, status: Contribution['status']) => Promise<Contribution>
  deleteContribution: (id: string) => Promise<void>
  getStats: (groupId?: string) => Promise<ContributionStats>
}

export function useContributions(groupId?: string): UseContributionsReturn {
  const { data: session } = useSession()
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [stats, setStats] = useState<ContributionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!session?.user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      if (groupId) queryParams.append('groupId', groupId)
      queryParams.append('limit', '100')

      const response = await fetch(`/api/contributions?${queryParams}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch contributions: ${response.statusText}`)
      }

      const data = await response.json()
      setContributions(data.contributions || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching contributions:', err)
    } finally {
      setLoading(false)
    }
  }, [session?.user, groupId])

  const getStats = useCallback(
    async (statsGroupId?: string): Promise<ContributionStats> => {
      const queryParams = new URLSearchParams()
      if (statsGroupId) queryParams.append('groupId', statsGroupId)

      const response = await fetch(`/api/contributions/stats?${queryParams}`)

      if (!response.ok) {
        throw new Error('Failed to fetch contribution stats')
      }

      const data = await response.json()
      setStats(data.stats)
      return data.stats
    },
    []
  )

  const createContribution = useCallback(
    async (contribData: Omit<Contribution, 'id' | 'createdAt' | 'paidAt' | 'user' | 'group'>): Promise<Contribution> => {
      const response = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contribData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create contribution')
      }

      const data = await response.json()
      await refetch()
      return data.contribution
    },
    [refetch]
  )

  const updateContributionStatus = useCallback(
    async (id: string, status: Contribution['status']): Promise<Contribution> => {
      const response = await fetch(`/api/contributions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update contribution')
      }

      const data = await response.json()
      await refetch()
      return data.contribution
    },
    [refetch]
  )

  const deleteContribution = useCallback(
    async (id: string): Promise<void> => {
      const response = await fetch(`/api/contributions/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete contribution')
      }

      await refetch()
    },
    [refetch]
  )

  useEffect(() => {
    refetch()
    getStats(groupId)
  }, [session?.user, groupId, refetch, getStats])

  return {
    contributions,
    stats,
    loading,
    error,
    refetch,
    createContribution,
    updateContributionStatus,
    deleteContribution,
    getStats,
  }
}
