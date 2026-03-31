"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"

interface Contribution {
  id: string
  amount: number
  status: "PENDING" | "PAID" | "OVERDUE"
  dueDate: string
  paidAt?: string | null
  groupId: string
  group?: {
    id: string
    name: string
  }
}

interface ContributionCalendarProps {
  contributions: Contribution[]
}

export function ContributionCalendar({ contributions }: ContributionCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthYear = currentDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  })

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()

  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const getDaysArray = () => {
    const days = []
    const totalDays = daysInMonth(currentDate)
    const firstDay = firstDayOfMonth(currentDate)

    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i))
    }

    return days
  }

  const days = getDaysArray()

  const getContributionsForDate = (date: Date | null) => {
    if (!date) return []
    const dateStr = date.toISOString().split("T")[0]
    return contributions.filter((c) => c.dueDate.split("T")[0] === dateStr)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-50 border-green-200 text-green-800"
      case "PENDING":
        return "bg-blue-50 border-blue-200 text-blue-800"
      case "OVERDUE":
        return "bg-red-50 border-red-200 text-red-800"
      default:
        return "bg-gray-50 border-gray-200 text-gray-800"
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PAID":
        return "default"
      case "PENDING":
        return "secondary"
      case "OVERDUE":
        return "destructive"
      default:
        return "outline"
    }
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const today = new Date()
  const isToday = (date: Date | null) => {
    if (!date) return false
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Contribution Calendar
            </CardTitle>
            <CardDescription>View upcoming contributions and due dates</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-40 text-center">{monthYear}</span>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              const contribsForDate = getContributionsForDate(date)
              const hasContribs = contribsForDate.length > 0

              return (
                <div
                  key={index}
                  className={`
                    relative min-h-24 p-2 rounded-lg border-2 text-xs
                    ${date === null ? "bg-muted/20" : "bg-white border-border"}
                    ${isToday(date) ? "border-primary bg-primary/5" : ""}
                  `}
                >
                  {date !== null && (
                    <>
                      <div className={`font-semibold mb-1 ${isToday(date) ? "text-primary" : ""}`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {contribsForDate.slice(0, 2).map((contrib) => (
                          <div
                            key={contrib.id}
                            className={`p-1 rounded text-xs border ${getStatusColor(contrib.status)}`}
                            title={`${contrib.group?.name || "Group"}: XAF ${contrib.amount}`}
                          >
                            <div className="font-medium truncate">{contrib.amount}</div>
                            <Badge variant={getStatusBadgeVariant(contrib.status)} className="text-[10px] mt-0.5">
                              {contrib.status.charAt(0)}
                            </Badge>
                          </div>
                        ))}
                        {contribsForDate.length > 2 && (
                          <div className="text-[10px] text-muted-foreground">+{contribsForDate.length - 2} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t space-y-2">
            <p className="text-sm font-medium">Legend:</p>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                <span>Paid</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
                <span>Overdue</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
