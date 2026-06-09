"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Wallet, CreditCard, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import { containerVariants, itemVariants } from "@/lib/animations"
import { useGroups } from "@/hooks/use-groups"
import { useContributions } from "@/hooks/use-contributions"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardOverview() {
  const { groups, loading: groupsLoading } = useGroups()
  const { stats, loading: statsLoading } = useContributions()

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  const totalContributions = stats?.totalAmount || 0
  const completionRate = stats?.completionRate || 0
  const activeGroups = groups.filter(g => g.status !== 'INACTIVE').length
  const paidAmount = stats?.paidAmount || 0

  const cards = [
    {
      title: "Active Groups",
      value: activeGroups.toString(),
      change: `${groups.length} total groups`,
      icon: Users,
      iconClass: "text-primary bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      title: "Total Contributions",
      value: formatCurrency(totalContributions),
      change: `${formatCurrency(stats?.pendingAmount || 0)} pending`,
      icon: Wallet,
      iconClass: "text-secondary bg-secondary/10",
      borderColor: "border-secondary/30",
    },
    {
      title: "Amount Paid",
      value: formatCurrency(paidAmount),
      change: `${stats?.paidCount || 0} of ${stats?.totalCount || 0} paid`,
      icon: CreditCard,
      iconClass: "text-secondary bg-secondary/10",
      borderColor: "border-secondary/30",
    },
    {
      title: "Completion Rate",
      value: `${completionRate.toFixed(1)}%`,
      change: "Overall health score",
      icon: TrendingUp,
      iconClass: "text-primary bg-primary/10",
      borderColor: "border-primary/20",
    },
  ]

  const isLoading = groupsLoading || statsLoading

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
            <Card className={`border shadow-md hover:shadow-lg transition-shadow h-full rounded-2xl ${card.borderColor}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${card.iconClass}`}
                >
                  {(() => {
                    const Icon = card.icon
                    return <Icon className="h-4 w-4" />
                  })()}
                </motion.div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold">{card.value}</div>
                    <p className="text-sm text-muted-foreground">{card.change}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  )
}
