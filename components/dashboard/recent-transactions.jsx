"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useContributions } from "@/hooks/use-contributions"
import { Skeleton } from "@/components/ui/skeleton"

export function RecentTransactions() {
  const { contributions, loading } = useContributions()

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'PAID':
        return 'secondary'
      case 'PENDING':
        return 'outline'
      case 'OVERDUE':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusDisplay = (status) => {
    const statusMap = {
      PAID: 'Completed',
      PENDING: 'Pending',
      OVERDUE: 'Overdue',
    }
    return statusMap[status] || status
  }

  const recentTransactions = contributions.slice(0, 5)

  return (
    <Card className="border-none shadow-md w-full">
      <CardHeader>
        <CardTitle>Recent Contributions</CardTitle>
        <CardDescription>Your latest contribution activities across all groups.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {loading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No contributions yet</p>
            </div>
          ) : (
            recentTransactions.map((contribution) => (
              <div
                key={contribution.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <Avatar className="h-8 w-8 border-2 border-muted flex-shrink-0">
                    <AvatarImage
                      src={`/placeholder.svg?height=36&width=36`}
                      alt={contribution.group?.name || 'Group'}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {(contribution.group?.name || 'G').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {contribution.group?.name || 'Unknown Group'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(contribution.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                  <p className="text-sm font-bold text-foreground">
                    {formatCurrency(contribution.amount)}
                  </p>
                  <Badge variant={getStatusVariant(contribution.status)}>
                    {getStatusDisplay(contribution.status)}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
