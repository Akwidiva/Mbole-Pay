"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

export function UpcomingPayments() {
  const payments = [
    {
      id: "1",
      group: "Mbole Savings Group",
      amount: "₦ 50,000",
      dueDate: "2023-04-15",
      daysLeft: 5,
    },
    {
      id: "2",
      group: "Family Support Group",
      amount: "₦ 25,000",
      dueDate: "2023-04-20",
      daysLeft: 10,
    },
    {
      id: "3",
      group: "Business Investment Group",
      amount: "₦ 75,000",
      dueDate: "2023-04-30",
      daysLeft: 20,
    },
  ]

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <CardTitle>Upcoming Payments</CardTitle>
        <CardDescription>Your scheduled contributions for this month.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{payment.group}</p>
                <p className="text-sm font-bold">{payment.amount}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Due in {payment.daysLeft} days</p>
                </div>
                <Button
                  size="sm"
                  variant={payment.daysLeft <= 5 ? "default" : "outline"}
                  className={
                    payment.daysLeft <= 5 ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" : ""
                  }
                >
                  Pay Now
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
