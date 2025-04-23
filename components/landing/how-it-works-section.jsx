import { Card, CardContent } from "@/components/ui/card"

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
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 mt-8">
          {steps.map((step, index) => (
            <Card key={index} className="relative overflow-hidden border-none bg-background shadow-md">
              <div className="absolute -top-6 -left-6 h-16 w-16 rounded-full bg-secondary/20 flex items-center justify-center">
                <span className="text-secondary-foreground font-bold text-xl">{step.number}</span>
              </div>
              <CardContent className="pt-8 pb-6 px-6">
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
