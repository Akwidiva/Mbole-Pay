"use client"

import { motion } from "framer-motion"
import { AllUsers } from "@/components/admin/all-users"
import { containerVariants, itemVariants, pageVariants } from "@/lib/animations"

export default function AdminUsersPage() {
  return (
    <motion.div className="space-y-8" variants={pageVariants} initial="initial" animate="animate">
      <motion.div className="space-y-3" variants={containerVariants} initial="initial" animate="animate">
        <motion.h1 className="text-3xl font-bold tracking-tight" variants={itemVariants}>
          Manage Users
        </motion.h1>
        <motion.p className="max-w-2xl text-sm text-muted-foreground" variants={itemVariants}>
          Review accounts, monitor activity, and keep the community healthy from one place.
        </motion.p>
      </motion.div>
      <motion.div variants={itemVariants}>
        <AllUsers />
      </motion.div>
    </motion.div>
  )
}
