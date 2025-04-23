import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Quote } from "lucide-react"

export function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "Mbole Pay has transformed how our family savings group operates. No more chasing people for payments or keeping track of who paid what. Everything is automated and transparent.",
      author: "Esther Nkongho",
      role: "Group Leader, Family Support Group",
      avatar: "EN",
    },
    {
      quote:
        "As someone who manages multiple savings groups, Mbole Pay has been a game-changer. The dispute resolution feature alone has saved us countless hours of arguments.",
      author: "John Mbaku",
      role: "Financial Manager, Business Investment Group",
      avatar: "JM",
    },
    {
      quote:
        "I was skeptical about moving our traditional tontine online, but Mbole Pay made the transition seamless. Now I can't imagine going back to the old way of doing things.",
      author: "Marie Tabe",
      role: "Member, Mbole Savings Group",
      avatar: "MT",
    },
  ]

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted" id="testimonials">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-primary/20 px-3 py-1 text-sm text-primary">Testimonials</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">What Our Users Say</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Don't just take our word for it. Here's what people using Mbole Pay have to say.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-background border-none shadow-md">
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-primary/40 mb-4" />
                <p className="mb-6 italic text-muted-foreground">{testimonial.quote}</p>
                <div className="flex items-center gap-4">
                  <Avatar className="border-2 border-secondary">
                    <AvatarImage src={`/placeholder.svg?height=40&width=40`} alt={testimonial.author} />
                    <AvatarFallback className="bg-primary text-primary-foreground">{testimonial.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
