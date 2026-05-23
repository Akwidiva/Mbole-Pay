export function SiteFooter() {
  return (
    <footer className="border-t py-6 md:py-0 bg-muted/50">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            M
          </div>
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
