"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { motion } from "framer-motion"
import { itemVariants } from "@/lib/animations"

export function DashboardHeader({ heading, text, children }) {
  return (
    <motion.div
      className="flex items-center justify-between px-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid gap-1">
        <h1 className="font-heading text-3xl md:text-4xl">{heading}</h1>
        {text && <p className="text-lg text-muted-foreground">{text}</p>}
      </div>
      {children ? (
        children
      ) : (
        <>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Button asChild>
              <Link href="/groups/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Group
              </Link>
            </Button>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
