"use client"

import { motion } from "framer-motion"
import { PendingDisputes } from "@/components/admin/pending-disputes"
import { containerVariants, itemVariants, pageVariants } from "@/lib/animations"

export default function AdminDisputesPage() {
  return (
    <motion.div className="space-y-8" variants={pageVariants} initial="initial" animate="animate">
      <motion.div className="space-y-3" variants={containerVariants} initial="initial" animate="animate">
        <motion.h1 className="text-3xl font-bold tracking-tight" variants={itemVariants}>
          Manage Disputes
        </motion.h1>
        <motion.p className="max-w-2xl text-sm text-muted-foreground" variants={itemVariants}>
          Triage unresolved cases, prioritize what needs attention, and move issues toward resolution.
        </motion.p>
      </motion.div>
      <motion.div variants={itemVariants}>
        <PendingDisputes />
      </motion.div>
    </motion.div>
  )
}
