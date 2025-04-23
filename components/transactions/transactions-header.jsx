import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function TransactionsHeader({ heading, text }) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="grid gap-1">
        <h1 className="font-heading text-3xl md:text-4xl">{heading}</h1>
        {text && <p className="text-lg text-muted-foreground">{text}</p>}
      </div>
      <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
    </div>
  )
}
