"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Wallet, CreditCard, TrendingUp } from "lucide-react"

export function DashboardOverview() {
  const cards = [
    {
      title: "Active Groups",
      value: "3",
      change: "+1 from last month",
      icon: Users,
      iconClass: "text-primary bg-primary/10",
    },
    {
      title: "Total Contributions",
      value: "₦ 1,250,000",
      change: "+₦ 150,000 from last month",
      icon: Wallet,
      iconClass: "text-secondary bg-secondary/10",
    },
    {
      title: "Upcoming Payout",
      value: "₦ 250,000",
      change: "Due in 5 days",
      icon: CreditCard,
      iconClass: "text-accent bg-accent/10",
    },
    {
      title: "Group Health",
      value: "98%",
      change: "All members in good standing",
      icon: TrendingUp,
      iconClass: "text-primary bg-primary/10",
    },
  ]

  return (
    <>
      {cards.map((card, index) => (
        <Card key={index} className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center ${
                index % 2 === 0 ? "bg-primary/10" : index % 3 === 0 ? "bg-accent/10" : "bg-secondary/10"
              }`}
            >
              <card.icon
                className={`h-4 w-4 ${
                  index % 2 === 0 ? "text-primary" : index % 3 === 0 ? "text-accent" : "text-secondary"
                }`}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.change}</p>
          </CardContent>
        </Card>
      ))}
    </>
  )
}
