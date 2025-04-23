import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 community-pattern">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Digitize Your Community Savings Groups
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Mbole Pay automates and digitizes community savings groups ("njangi" or "tontine") using smart
                contracts, auto-payments, and transparent tracking.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/dashboard">
                <Button size="lg" className="gap-1.5">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative h-[350px] w-[350px] sm:h-[400px] sm:w-[400px] lg:h-[450px] lg:w-[450px] xl:h-[500px] xl:w-[500px]">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-[100px] opacity-20"></div>
              <div className="relative z-10 bg-muted border rounded-lg shadow-lg overflow-hidden h-full w-full flex items-center justify-center">
                <div className="p-8 space-y-6 w-full max-w-md">
                  <div className="space-y-2 text-center">
                    <h3 className="text-2xl font-bold">Mbole Savings Group</h3>
                    <p className="text-sm text-muted-foreground">Next payout: April 15, 2023</p>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-background rounded-md p-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Total Contributions</p>
                        <p className="text-2xl font-bold">₦ 1,250,000</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold">15</span>
                      </div>
                    </div>
                    <div className="bg-background rounded-md p-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Your Balance</p>
                        <p className="text-2xl font-bold">₦ 250,000</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center">
                        <span className="text-secondary-foreground font-bold">+</span>
                      </div>
                    </div>
                    <Button className="w-full">Make Payment</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
