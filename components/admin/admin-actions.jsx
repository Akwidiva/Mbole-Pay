"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { ArrowRight, LogOut, ShieldAlert, Users, Layers3 } from "lucide-react"
import { motion } from "framer-motion"
import { containerVariants, itemVariants } from "@/lib/animations"

export function AdminActions() {
  return (
    <Card className="border-border/70 bg-card/90 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div className="space-y-3 pt-4" variants={containerVariants} initial="initial" animate="animate">
          <Link href="/admin/users">
            <motion.div variants={itemVariants} whileHover={{ x: 4 }} transition={{ duration: 0.18 }}>
              <Button className="w-full justify-start gap-2 rounded-2xl border-border/70 bg-white shadow-sm hover:bg-primary/5" variant="outline">
              <Users className="h-4 w-4 text-primary" />
              Manage Users
              <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </motion.div>
          </Link>
          <Link href="/admin/groups">
            <motion.div variants={itemVariants} whileHover={{ x: 4 }} transition={{ duration: 0.18 }}>
              <Button className="w-full justify-start gap-2 rounded-2xl border-border/70 bg-white shadow-sm hover:bg-secondary/5" variant="outline">
              <Layers3 className="h-4 w-4 text-secondary" />
              Manage Groups
              <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </motion.div>
          </Link>
          <Link href="/admin/disputes">
            <motion.div variants={itemVariants} whileHover={{ x: 4 }} transition={{ duration: 0.18 }}>
              <Button className="w-full justify-start gap-2 rounded-2xl border-border/70 bg-white shadow-sm hover:bg-amber-500/5" variant="outline">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              Resolve Disputes
              <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </motion.div>
          </Link>
          <motion.div variants={itemVariants} whileHover={{ x: 4 }} transition={{ duration: 0.18 }}>
            <Button
              className="w-full justify-start gap-2 rounded-2xl"
              variant="destructive"
              onClick={() => signOut({ callbackUrl: "/signin" })}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  )
}
