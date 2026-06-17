"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useSession } from "next-auth/react"
import Link from "next/link"

export function UserNav() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const isLanding = pathname === "/"

  if (status === "loading") {
    return (
      <div className="flex items-center gap-4">
        <div className="h-10 w-20 animate-pulse bg-muted rounded" />
      </div>
    )
  }

  const profileBtnClasses = isLanding
    ? "relative h-10 w-10 rounded-full bg-primary hover:bg-primary/90 p-0"
    : "relative h-10 w-10 rounded-full bg-primary hover:bg-primary/90 p-0"
  const avatarClasses = isLanding ? "h-10 w-10 bg-primary" : "h-10 w-10 bg-primary"
  const avatarFallbackClasses = isLanding ? "text-white font-semibold bg-primary" : "text-white font-semibold bg-primary"

  const user = session?.user
  const displayName = user?.name || user?.username || "User"
  const displayEmail = user?.email || ""
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"

  return (
    <div className="flex items-center gap-4">
      {!user ? (
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="text-sm font-medium text-primary hover:underline">
            <Link href="/signin">Sign in</Link>
          </Button>
          <Button asChild className="text-sm font-medium rounded-md px-3 py-1.5 bg-primary text-primary-foreground">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      ) : (
        <>
          <NotificationsDropdown />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className={profileBtnClasses}>
                <Avatar className={avatarClasses}>
                  {isLanding ? null : <AvatarImage src={user.image || "/placeholder.svg"} alt={displayName} />}
                  <AvatarFallback className={avatarFallbackClasses}>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" side="bottom" sideOffset={24} forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })} className="text-destructive focus:text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  )
}
