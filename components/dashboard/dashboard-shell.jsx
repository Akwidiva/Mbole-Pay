"use client"

import { motion } from "framer-motion"
import { pageVariants, containerVariants } from "@/lib/animations"

export function DashboardShell({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 p-4 pt-6 md:p-8"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="space-y-6 bg-card/90 border border-border/60 rounded-2xl p-6 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.12)]"
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  )
}
