"use client"

import { motion } from "framer-motion"
import { pageVariants } from "@/lib/animations"

export function DashboardShell({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 space-y-4 p-4 pt-6 md:p-8"
    >
      {children}
    </motion.div>
  )
}
