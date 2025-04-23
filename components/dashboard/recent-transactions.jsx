"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function RecentTransactions() {
  const transactions = [
    {
      id: "1",
      name: "Mbole Savings Group",
      amount: "₦ 50,000",
      date: "2023-04-05",
      status: "completed",
      type: "contribution",
    },
    {
      id: "2",
      name: "Family Support Group",
      amount: "₦ 25,000",
      date: "2023-04-03",
      status: "completed",
      type: "contribution",
    },
    {
      id: "3",
      name: "Mbole Savings Group",
      amount: "₦ 200,000",
      date: "2023-03-28",
      status: "completed",
      type: "payout",
    },
    {
      id: "4",
      name: "Business Investment Group",
      amount: "₦ 75,000",
      date: "2023-03-25",
      status: "pending",
      type: "contribution",
    },
    {
      id: "5",
      name: "Family Support Group",
      amount: "₦ 25,000",
      date: "2023-03-20",
      status: "failed",
      type: "contribution",
    },
  ]

  return (
    <Card className="col-span-2 border-none shadow-md">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your latest financial activities across all groups.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-9 w-9 border-2 border-muted">
                  <AvatarImage src={`/placeholder.svg?height=36&width=36`} alt={transaction.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {transaction.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">{transaction.name}</p>
                  <p className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <p
                  className={`text-sm font-medium ${transaction.type === "payout" ? "text-secondary-foreground" : ""}`}
                >
                  {transaction.type === "payout" ? "+" : "-"}
                  {transaction.amount}
                </p>
                <Badge
                  variant={
                    transaction.status === "completed"
                      ? "default"
                      : transaction.status === "pending"
                        ? "outline"
                        : "destructive"
                  }
                  className={
                    transaction.status === "completed"
                      ? "bg-accent text-accent-foreground hover:bg-accent/80"
                      : transaction.status === "pending"
                        ? "border-accent text-accent hover:bg-accent/10"
                        : ""
                  }
                >
                  {transaction.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
