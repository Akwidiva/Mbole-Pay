"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Wallet, Users, BarChart4, Vote, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { containerVariants, itemVariants } from "@/lib/animations"

export function FeaturesSection() {
  const features = [
    {
      icon: Wallet,
      title: "Automated Payments",
      description: "Schedule recurring contributions with auto-debit using smart contracts.",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      borderColor: "border-secondary/30",
    },
    {
      icon: Shield,
      title: "Secure Transactions",
      description: "End-to-end encryption and audited smart contracts for maximum security.",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
    },
    {
      icon: Users,
      title: "Group Management",
      description: "Create and manage multiple savings groups with different rules and members.",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      borderColor: "border-secondary/30",
    },
    {
      icon: BarChart4,
      title: "Transparent Tracking",
      description: "Real-time balance tracking and downloadable financial statements.",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
    },
    {
      icon: Vote,
      title: "Dispute Resolution",
      description: "Resolve conflicts through anonymous voting enforced by smart contracts.",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      borderColor: "border-secondary/30",
    },
    {
      icon: Clock,
      title: "Scheduled Payouts",
      description: "First-come, first-paid system with automated alerts to recipients.",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
    },
  ]

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted" id="features">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-secondary/20 px-3 py-1 text-sm text-secondary font-medium">Features</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Mbole Pay provides all the tools you need to digitize and automate your community savings groups.
            </p>
          </div>
        </div>
        <motion.div
          className="mx-auto grid max-w-5xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8"
          variants={containerVariants}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <motion.div
                  whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <Card className={`bg-background border shadow-md hover:shadow-lg transition-shadow h-full ${feature.borderColor}`}>
                    <CardHeader>
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.2 }}
                        className={`${feature.bgColor} w-12 h-12 rounded-full flex items-center justify-center mb-4`}
                      >
                        <feature.icon className={`h-6 w-6 ${feature.color}`} />
                      </motion.div>
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
        </motion.div>
      </div>
    </section>
  )
}
