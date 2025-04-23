"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, ArrowUpRight, Settings, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function GroupsList() {
  const [activeTab, setActiveTab] = useState("active")

  const activeGroups = [
    {
      id: "1",
      name: "Mbole Savings Group",
      members: 15,
      totalContributions: "₦ 1,250,000",
      nextPayout: "April 15, 2023",
      nextPayoutRecipient: "John Doe",
      contributionAmount: "₦ 50,000",
      frequency: "Monthly",
      progress: 75,
      status: "active",
    },
    {
      id: "2",
      name: "Family Support Group",
      members: 8,
      totalContributions: "₦ 400,000",
      nextPayout: "April 20, 2023",
      nextPayoutRecipient: "Marie Tabe",
      contributionAmount: "₦ 25,000",
      frequency: "Bi-weekly",
      progress: 60,
      status: "active",
    },
    {
      id: "3",
      name: "Business Investment Group",
      members: 12,
      totalContributions: "₦ 900,000",
      nextPayout: "April 30, 2023",
      nextPayoutRecipient: "Esther Nkongho",
      contributionAmount: "₦ 75,000",
      frequency: "Monthly",
      progress: 40,
      status: "active",
    },
  ]

  const pendingGroups = [
    {
      id: "4",
      name: "Community Development Fund",
      members: 5,
      requiredMembers: 10,
      contributionAmount: "₦ 30,000",
      frequency: "Monthly",
      creator: "James Oben",
      status: "pending",
    },
    {
      id: "5",
      name: "Education Savings Circle",
      members: 8,
      requiredMembers: 12,
      contributionAmount: "₦ 15,000",
      frequency: "Monthly",
      creator: "Sarah Mendi",
      status: "pending",
    },
  ]

  return (
    <Tabs defaultValue="active" className="w-full mt-6" onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="active">Active Groups</TabsTrigger>
        <TabsTrigger value="pending">Pending Invitations</TabsTrigger>
      </TabsList>
      <TabsContent value="active" className="space-y-4">
        {activeGroups.map((group) => (
          <Card key={group.id} className="border-none shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={`/placeholder.svg?height=48&width=48`} alt={group.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {group.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{group.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      {group.members} members
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-5 w-5" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Invite Members</DropdownMenuItem>
                    <DropdownMenuItem>View Transactions</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Group Settings</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Leave Group</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Contributions:</span>
                    <span className="text-sm font-medium">{group.totalContributions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Contribution Amount:</span>
                    <span className="text-sm font-medium">{group.contributionAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Frequency:</span>
                    <span className="text-sm font-medium">{group.frequency}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Next Payout:</span>
                    <span className="text-sm font-medium">{group.nextPayout}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Recipient:</span>
                    <span className="text-sm font-medium">{group.nextPayoutRecipient}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cycle Progress:</span>
                    <span className="text-sm font-medium">{group.progress}%</span>
                  </div>
                </div>
              </div>
              <Progress value={group.progress} className="h-2 mt-4" />
            </CardContent>
            <CardFooter className="flex justify-between pt-4">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <Settings className="mr-2 h-4 w-4" />
                Manage
              </Button>
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Make Payment
              </Button>
            </CardFooter>
          </Card>
        ))}
      </TabsContent>
      <TabsContent value="pending" className="space-y-4">
        {pendingGroups.map((group) => (
          <Card key={group.id} className="border-none shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12 border-2 border-muted">
                    <AvatarImage src={`/placeholder.svg?height=48&width=48`} alt={group.name} />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {group.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{group.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      {group.members}/{group.requiredMembers} members joined
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="border-accent text-accent">
                  Invitation
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Contribution Amount:</span>
                    <span className="text-sm font-medium">{group.contributionAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Frequency:</span>
                    <span className="text-sm font-medium">{group.frequency}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Created By:</span>
                    <span className="text-sm font-medium">{group.creator}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <span className="text-sm font-medium capitalize">Waiting for members</span>
                  </div>
                </div>
              </div>
              <Progress value={(group.members / group.requiredMembers) * 100} className="h-2 mt-4" />
            </CardContent>
            <CardFooter className="flex justify-between pt-4">
              <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                Decline
              </Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Accept Invitation</Button>
            </CardFooter>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  )
}
