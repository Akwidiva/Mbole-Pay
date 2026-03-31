"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useContributions } from "@/hooks/use-contributions"
import { useGroups } from "@/hooks/use-groups"
import { ContributionFilters } from "./contribution-filters"
import { ContributionCalendar } from "./contribution-calendar"
import { Eye, Loader2 } from "lucide-react"

export function ContributionsPage() {
  const { contributions, loading } = useContributions()
  const { groups } = useGroups()
  const [filteredContributions, setFilteredContributions] = useState(contributions)
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    setFilteredContributions(contributions)
  }, [contributions])

  const handleFilter = (filters: any) => {
    let filtered = [...contributions]

    if (filters.status) {
      filtered = filtered.filter((c) => c.status === filters.status)
    }

    if (filters.groupId) {
      filtered = filtered.filter((c) => c.groupId === filters.groupId)
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((c) => new Date(c.dueDate) >= new Date(filters.dateFrom))
    }

    if (filters.dateTo) {
      filtered = filtered.filter((c) => new Date(c.dueDate) <= new Date(filters.dateTo))
    }

    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.group?.name?.toLowerCase().includes(search) ||
          c.id.toLowerCase().includes(search) ||
          c.amount.toString().includes(search)
      )
    }

    setFilteredContributions(filtered)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CM", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800"
      case "OVERDUE":
        return "bg-red-100 text-red-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Contributions</h2>
        <Button
          variant="outline"
          onClick={() => setShowCalendar(!showCalendar)}
          className="flex items-center space-x-2"
        >
          📅 {showCalendar ? "List View" : "Calendar View"}
        </Button>
      </div>

      {/* Filters */}
      <ContributionFilters onFilter={handleFilter} groups={groups} />

      {/* Calendar or List View */}
      {showCalendar ? (
        <ContributionCalendar contributions={filteredContributions} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Contribution List ({filteredContributions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredContributions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No contributions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredContributions.map((contribution) => (
                  <div
                    key={contribution.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                        <AvatarFallback>
                          {(contribution.group?.name || "G").substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{contribution.group?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(contribution.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(contribution.amount)}</p>
                        <Badge className={`text-xs mt-1 ${getStatusColor(contribution.status)}`}>
                          {contribution.status}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
