"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Users, FileText, ArrowUpRight, Settings, Wallet } from "lucide-react"
import { motion } from "framer-motion"
import { containerVariants, itemVariants } from "@/lib/animations"
// Use page-based create flow instead of modal

export function QuickActions() {
  
  const actions = [
    {
      title: "Create New Group",
      description: "Start a new savings group with friends or family",
      icon: PlusCircle,
      variant: "default",
      className: "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary/30",
      href: "/groups/new",
    },
    {
      title: "Invite Members",
      description: "Grow your existing groups by inviting new members",
      icon: Users,
      variant: "outline",
      className: "border-2 border-secondary text-secondary hover:bg-secondary/10 hover:border-secondary/80",
      href: "/groups/invite",
    },
    {
      title: "Generate Reports",
      description: "Download financial statements for your records",
      icon: FileText,
      variant: "outline",
      className: "border-2 border-secondary text-secondary hover:bg-secondary/10 hover:border-secondary/80",
      href: "/transactions",
    },
    {
      title: "Make Payment",
      description: "Contribute to one of your active groups",
      icon: ArrowUpRight,
      variant: "outline",
      className: "border border-primary text-primary hover:bg-primary/10",
      href: "/dashboard/payments",
    },
    {
      title: "Withdraw Cash",
      description: "Generate an MTN MoMo dial code to withdraw funds",
      icon: Wallet,
      variant: "outline",
      className: "border border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40",
      href: "/dashboard/withdraw",
    },
    {
      title: "Group Settings",
      description: "Manage rules and configurations for your groups",
      icon: Settings,
      variant: "outline",
      className: "border border-muted-foreground text-muted-foreground hover:bg-muted",
      href: "/groups",
    },
  ]

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks to help you manage your savings groups.</CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
          variants={containerVariants}
          initial="initial"
          animate="animate"
        >
          {actions.map((action, index) => (
            <motion.div key={index} variants={itemVariants}>
              <motion.div
                whileHover={{ y: -6, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {action.href ? (
                  <Button
                    asChild
                    variant={action.variant}
                    className={`h-auto flex-col items-start gap-2 p-4 justify-start text-left w-full ${action.className}`}
                  >
                    <Link href={action.href} className="w-full">
                      <motion.div whileHover={{ scale: 1.2, rotate: 10 }} transition={{ duration: 0.2 }}>
                        <action.icon className="h-5 w-5" />
                      </motion.div>
                      <div>
                        <p className="font-medium">{action.title}</p>
                        <p className={`text-xs ${action.variant === "default" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {action.description}
                        </p>
                      </div>
                    </Link>
                  </Button>
                ) : (
                  <div className={`h-auto flex-col items-start gap-2 p-4 justify-start text-left w-full ${action.className}`}>
                    <motion.div whileHover={{ scale: 1.2, rotate: 10 }} transition={{ duration: 0.2 }}>
                      <action.icon className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <p className="font-medium">{action.title}</p>
                      <p className={`text-xs ${action.variant === "default" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        {action.description}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  )
}
