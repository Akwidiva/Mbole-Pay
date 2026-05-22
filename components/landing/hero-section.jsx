"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { pageVariants, containerVariants, itemVariants } from "@/lib/animations"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * @typedef {Object} UserStats
 * @property {number} totalContributions
 * @property {number} pendingPayout
 * @property {string} [nextPayoutDate]
 * @property {number} [memberCount]
 */

export function HeroSection() {
  const { data: session } = useSession()
  /** @type {[UserStats | null, Function]} */
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!session?.user) {
      setLoading(false)
      return
    }

    async function fetchStats() {
      try {
        setLoading(true)
        const response = await fetch("/api/dashboard/stats")
        
        if (response.ok) {
          const data = await response.json()
          setStats(data.data || data)
        } else {
          setError("Failed to load stats")
        }
      } catch (err) {
        console.error("Error fetching stats:", err)
        setError("Failed to load stats")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [session?.user])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-CM", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  const totalContributions = stats?.totalContributions || 0
  const pendingPayout = stats?.pendingPayout || 0
  const memberCount = stats?.memberCount || 0

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 community-pattern">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <motion.div
            initial="initial"
            animate="animate"
            variants={containerVariants}
            className="flex flex-col justify-center space-y-4"
          >
            <motion.div variants={itemVariants} className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Digitize Your Community Savings Groups
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Mbole Pay automates and digitizes community savings groups ("njangi" or "tontine") using smart
                contracts, auto-payments, and transparent tracking.
              </p>
            </motion.div>
            <motion.div variants={itemVariants} className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="flex flex-col items-center justify-center gap-1.5 px-8 py-4 text-base min-w-[200px]"
                >
                  <span className="font-bold text-center">Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="flex flex-col items-center justify-center font-bold px-8 py-4 text-base min-w-[200px]"
                >
                  <span className="text-center font-bold">Learn More</span>
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center"
          >
            <div className="relative h-[350px] w-[350px] sm:h-[400px] sm:w-[400px] lg:h-[450px] lg:w-[450px] xl:h-[500px] xl:w-[500px]">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent rounded-full blur-[100px] opacity-20"
              ></motion.div>
              <div className="relative z-10 bg-muted border rounded-lg shadow-lg overflow-hidden h-full w-full flex items-center justify-center">
                <div className="p-8 space-y-6 w-full max-w-md">
                  <div className="space-y-2 text-center">
                    <h3 className="text-2xl font-bold">Your Savings Overview</h3>
                    <p className="text-sm text-muted-foreground">
                      {stats?.nextPayoutDate
                        ? `Next payout: ${new Date(stats.nextPayoutDate).toLocaleDateString()}`
                        : "Loading..."}
                    </p>
                  </div>
                  <div className="space-y-4">
                    {loading ? (
                      <>
                        <div className="bg-background rounded-md p-4">
                          <Skeleton className="h-24 w-full" />
                        </div>
                        <div className="bg-background rounded-md p-4 border border-secondary/30">
                          <Skeleton className="h-24 w-full" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-background rounded-md p-4 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">Total Contributions</p>
                            <p className="text-2xl font-bold">{formatCurrency(totalContributions)}</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold">{memberCount}</span>
                          </div>
                        </div>
                        <div className="bg-background rounded-md p-4 flex justify-between items-center border border-secondary/30">
                          <div>
                            <p className="text-sm font-medium">Your Pending Payout</p>
                            <p className="text-2xl font-bold text-secondary">{formatCurrency(pendingPayout)}</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center">
                            <span className="text-secondary font-bold">➜</span>
                          </div>
                        </div>
                      </>
                    )}
                    <Link href="/dashboard">
                      <Button className="w-full">Make Payment</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
