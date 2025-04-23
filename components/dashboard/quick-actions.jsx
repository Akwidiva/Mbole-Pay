"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Users, FileText, ArrowUpRight, Settings } from "lucide-react"

export function QuickActions() {
  const actions = [
    {
      title: "Create New Group",
      description: "Start a new savings group with friends or family",
      icon: PlusCircle,
      variant: "default",
      className: "bg-primary text-primary-foreground hover:bg-primary/90",
    },
    {
      title: "Invite Members",
      description: "Grow your existing groups by inviting new members",
      icon: Users,
      variant: "outline",
      className: "border-primary text-primary hover:bg-primary/10",
    },
    {
      title: "Generate Reports",
      description: "Download financial statements for your records",
      icon: FileText,
      variant: "outline",
      className: "border-secondary text-secondary-foreground hover:bg-secondary/10",
    },
    {
      title: "Make Payment",
      description: "Contribute to one of your active groups",
      icon: ArrowUpRight,
      variant: "outline",
      className: "border-accent text-accent hover:bg-accent/10",
    },
    {
      title: "Group Settings",
      description: "Manage rules and configurations for your groups",
      icon: Settings,
      variant: "outline",
      className: "border-muted-foreground text-muted-foreground hover:bg-muted",
    },
  ]

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks to help you manage your savings groups.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className={`h-auto flex-col items-start gap-2 p-4 justify-start text-left ${action.className}`}
            >
              <action.icon className="h-5 w-5" />
              <div>
                <p className="font-medium">{action.title}</p>
                <p
                  className={`text-xs ${action.variant === "default" ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                >
                  {action.description}
                </p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
