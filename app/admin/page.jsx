"use client"

import { Suspense } from "react"
import { motion } from "framer-motion"
import { BarChart3, ShieldAlert, Users, WalletCards } from "lucide-react"
import { AdminOverview } from "@/components/admin/admin-overview"
import { AllUsers } from "@/components/admin/all-users"
import { AllGroups } from "@/components/admin/all-groups"
import { PendingDisputes } from "@/components/admin/pending-disputes"
import { AdminActions } from "@/components/admin/admin-actions"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { containerVariants, itemVariants, pageVariants } from "@/lib/animations"

const highlights = [
  { label: "Members", value: "Live oversight", icon: Users },
  { label: "Groups", value: "Operational health", icon: WalletCards },
  { label: "Disputes", value: "Faster resolution", icon: ShieldAlert },
  { label: "Insight", value: "Performance view", icon: BarChart3 },
]

export default function AdminPage() {
  return (
    <motion.div className="space-y-8" variants={pageVariants} initial="initial" animate="animate">
      <motion.section
        className="rounded-[2rem] border border-border/70 bg-white/80 p-6 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.15)] backdrop-blur-xl sm:p-8"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <motion.div className="max-w-2xl space-y-3" variants={itemVariants}>
            <p className="inline-flex items-center rounded-full border border-primary/10 bg-primary/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Admin control center
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Admin Dashboard
            </h1>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Manage users, groups, and disputes from a cleaner command surface with live visibility into the platform.
            </p>
          </motion.div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-xl">
            {highlights.map((item) => {
              const Icon = item.icon
              return (
                <motion.div key={item.label} className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm" variants={itemVariants} whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.2 }}>
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.section>

      <Suspense fallback={<DashboardSkeleton />}>
        <AdminOverview />

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <AllUsers />
          <AllGroups />
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <PendingDisputes />
          <AdminActions />
        </div>
      </Suspense>
    </motion.div>
  )
}
