import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export function GroupsHeader({ heading, text }) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="grid gap-1">
        <h1 className="font-heading text-3xl md:text-4xl">{heading}</h1>
        {text && <p className="text-lg text-muted-foreground">{text}</p>}
      </div>
      <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
        <PlusCircle className="mr-2 h-4 w-4" />
        New Group
      </Button>
    </div>
  )
}
