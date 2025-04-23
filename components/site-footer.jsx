import { Wallet } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t py-6 md:py-0 bg-muted/50">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <p className="text-sm leading-loose text-center md:text-left">
            &copy; {new Date().getFullYear()} Mbole Pay. All rights reserved.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <a href="#" className="text-muted-foreground hover:text-primary">
            Terms
          </a>
          <a href="#" className="text-muted-foreground hover:text-primary">
            Privacy
          </a>
          <a href="#" className="text-muted-foreground hover:text-primary">
            Contact
          </a>
        </div>
      </div>
    </footer>
  )
}
