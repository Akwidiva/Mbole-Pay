"use client"

import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { containerVariants, itemVariants } from "@/lib/animations"

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Create or Join a Group",
      description: "Start your own savings group or join an existing one with a simple invitation process.",
    },
    {
      number: "02",
      title: "Set Up Contribution Rules",
      description: "Define contribution amounts, frequency, and payout schedules that work for your group.",
    },
    {
      number: "03",
      title: "Make Regular Contributions",
      description: "Contribute via Mobile Money, Bank Transfer, or Card with automated reminders.",
    },
    {
      number: "04",
      title: "Receive Your Payout",
      description: "Get your funds automatically when it's your turn, based on the group's schedule.",
    },
  ]

  return (
    <section className="w-full py-12 md:py-24 lg:py-32" id="how-it-works">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-accent/20 px-3 py-1 text-sm text-accent">How It Works</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Simple Process, Powerful Results</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Mbole Pay makes it easy to manage your community savings groups with a straightforward process.
            </p>
          </div>
        </div>
        <motion.div
          className="mx-auto grid max-w-5xl grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-8"
          variants={containerVariants}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
        >
          {steps.map((step, index) => (
              <motion.div key={index} variants={itemVariants}>
                <motion.div
                  whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <Card className="relative overflow-hidden border-none bg-background shadow-md h-full">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="absolute -top-6 -left-6 h-16 w-16 rounded-full bg-secondary/20 flex items-center justify-center"
                    >
                      <span className="text-secondary-foreground font-bold text-xl">{step.number}</span>
                    </motion.div>
                    <CardContent className="pt-8 pb-6 px-6">
                      <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
        </motion.div>
      </div>
    </section>
  )
}
