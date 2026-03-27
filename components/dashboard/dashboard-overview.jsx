"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Wallet, CreditCard, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import { containerVariants, itemVariants } from "@/lib/animations"

export function DashboardOverview() {
  const cards = [
    {
      title: "Active Groups",
      value: "3",
      change: "+1 from last month",
      icon: Users,
      iconClass: "text-primary bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      title: "Total Contributions",
      value: "XAF 1,250,000",
      change: "+XAF 150,000 from last month",
      icon: Wallet,
      iconClass: "text-secondary bg-secondary/10",
      borderColor: "border-secondary/30",
    },
    {
      title: "Upcoming Payout",
      value: "XAF 250,000",
      change: "Due in 5 days",
      icon: CreditCard,
      iconClass: "text-secondary bg-secondary/10",
      borderColor: "border-secondary/30",
    },
    {
      title: "Group Health",
      value: "98%",
      change: "All members in good standing",
      icon: TrendingUp,
      iconClass: "text-primary bg-primary/10",
      borderColor: "border-primary/20",
    },
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="grid gap-4 md:grid-cols-4 w-full"
    >
      {cards.map((card, index) => (
        <motion.div key={index} variants={itemVariants}>
          <motion.div
            whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Card className={`border shadow-md hover:shadow-lg transition-shadow h-full ${card.borderColor}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${card.iconClass}`}
                >
                  <card.icon className="h-4 w-4" />
                </motion.div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  )
}
