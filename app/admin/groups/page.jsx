"use client"

import { motion } from "framer-motion"
import { AllGroups } from "@/components/admin/all-groups"
import { containerVariants, itemVariants, pageVariants } from "@/lib/animations"

export default function AdminGroupsPage() {
  return (
    <motion.div className="space-y-8" variants={pageVariants} initial="initial" animate="animate">
      <motion.div className="space-y-3" variants={containerVariants} initial="initial" animate="animate">
        <motion.h1 className="text-3xl font-bold tracking-tight" variants={itemVariants}>
          Manage Groups
        </motion.h1>
        <motion.p className="max-w-2xl text-sm text-muted-foreground" variants={itemVariants}>
          Keep membership, structure, and permissions organized with a quick overview of every group.
        </motion.p>
      </motion.div>
      <motion.div variants={itemVariants}>
        <AllGroups />
      </motion.div>
    </motion.div>
  )
}
