"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { X, Search, Filter } from "lucide-react"

interface ContributionFiltersProps {
  onFilter: (filters: {
    status?: string
    groupId?: string
    dateFrom?: string
    dateTo?: string
    search?: string
  }) => void
  groups: Array<{ id: string; name: string }>
}

export function ContributionFilters({ onFilter, groups }: ContributionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState({
    status: "",
    groupId: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  })

  const hasActiveFilters = Object.values(filters).some((v) => v !== "")

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
  }

  const handleApplyFilters = () => {
    onFilter(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== "")))
    setIsOpen(false)
  }

  const handleClearFilters = () => {
    setFilters({
      status: "",
      groupId: "",
      dateFrom: "",
      dateTo: "",
      search: "",
    })
    onFilter({})
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by group name or description..."
            value={filters.search}
            onChange={(e) => {
              handleFilterChange("search", e.target.value)
              onFilter({ ...filters, search: e.target.value })
            }}
            className="pl-10"
          />
        </div>
        <Button
          variant={isOpen ? "default" : "outline"}
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center"
        >
          <Filter className="h-4 w-4 mr-1" />
          {hasActiveFilters && (
            <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-xs font-bold">
              {Object.values(filters).filter((v) => v !== "").length}
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-destructive">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {isOpen && (
        <Card className="p-4 space-y-4 bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group">Group</Label>
              <Select value={filters.groupId} onValueChange={(value) => handleFilterChange("groupId", value)}>
                <SelectTrigger id="group">
                  <SelectValue placeholder="All groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Groups</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            <Button size="sm" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
