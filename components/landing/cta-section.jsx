"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { containerVariants, itemVariants } from "@/lib/animations"

export function CTASection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
      <div className="container px-4 md:px-6">
        <motion.div
          className="flex flex-col items-center justify-center space-y-4 text-center"
          variants={containerVariants}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants} className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Ready to Transform Your Savings Group?
            </h2>
            <p className="mx-auto max-w-[700px] text-primary-foreground/80 md:text-xl">
              Join thousands of users who are already managing their community savings groups with Mbole Pay.
            </p>
          </motion.div>
          <motion.div variants={itemVariants} className="flex flex-col gap-2 min-[400px]:flex-row">
            <Link href="/dashboard">
              <Button
                size="lg"
                variant="secondary"
                className="flex flex-col items-center justify-center gap-1.5 font-bold px-8 py-4 text-base min-w-[200px]"
              >
                <span className="text-center font-bold">Get Started Now</span>
              </Button>
            </Link>
            <Link href="#features">
              <Button
                size="lg"
                className="flex flex-col items-center justify-center font-bold px-8 py-4 text-base min-w-[200px] bg-primary text-primary-foreground hover:bg-primary/80 border-2 border-white"
              >
                <span className="text-center font-bold">Explore Features</span>
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
