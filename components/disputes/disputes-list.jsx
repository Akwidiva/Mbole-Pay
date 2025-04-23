"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle, Clock, Users, MessageSquare } from "lucide-react"

export function DisputesList() {
  const [activeTab, setActiveTab] = useState("active")

  const activeDisputes = [
    {
      id: "1",
      title: "Late Payment Penalty",
      description: "Dispute regarding the penalty for late payment in March cycle",
      group: "Mbole Savings Group",
      raisedBy: "John Doe",
      raisedOn: "2023-04-01",
      votesFor: 7,
      votesAgainst: 3,
      totalMembers: 15,
      daysLeft: 2,
      status: "active",
      category: "payment",
    },
    {
      id: "2",
      title: "Member Removal Request",
      description: "Proposal to remove inactive member who has missed 3 consecutive payments",
      group: "Family Support Group",
      raisedBy: "Marie Tabe",
      raisedOn: "2023-03-28",
      votesFor: 4,
      votesAgainst: 2,
      totalMembers: 8,
      daysLeft: 1,
      status: "active",
      category: "membership",
    },
    {
      id: "3",
      title: "Change in Contribution Amount",
      description: "Proposal to increase monthly contribution from ₦75,000 to ₦100,000",
      group: "Business Investment Group",
      raisedBy: "Esther Nkongho",
      raisedOn: "2023-03-25",
      votesFor: 5,
      votesAgainst: 4,
      totalMembers: 12,
      daysLeft: 3,
      status: "active",
      category: "rules",
    },
  ]

  const resolvedDisputes = [
    {
      id: "4",
      title: "Emergency Fund Allocation",
      description: "Dispute about using group funds for member's medical emergency",
      group: "Mbole Savings Group",
      raisedBy: "Peter Njoh",
      raisedOn: "2023-03-15",
      votesFor: 12,
      votesAgainst: 2,
      totalMembers: 15,
      resolvedOn: "2023-03-20",
      status: "resolved",
      resolution: "approved",
      category: "funds",
    },
    {
      id: "5",
      title: "Payment Method Change",
      description: "Request to add Mobile Money as an accepted payment method",
      group: "Family Support Group",
      raisedBy: "Sarah Mendi",
      raisedOn: "2023-03-10",
      votesFor: 7,
      votesAgainst: 1,
      totalMembers: 8,
      resolvedOn: "2023-03-15",
      status: "resolved",
      resolution: "approved",
      category: "payment",
    },
    {
      id: "6",
      title: "Membership Expansion",
      description: "Proposal to increase maximum group size from 12 to 15 members",
      group: "Business Investment Group",
      raisedBy: "James Oben",
      raisedOn: "2023-03-05",
      votesFor: 5,
      votesAgainst: 7,
      totalMembers: 12,
      resolvedOn: "2023-03-12",
      status: "resolved",
      resolution: "rejected",
      category: "rules",
    },
  ]

  return (
    <Tabs defaultValue="active" className="w-full mt-6" onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="active">Active Disputes</TabsTrigger>
        <TabsTrigger value="resolved">Resolved Disputes</TabsTrigger>
      </TabsList>
      <TabsContent value="active" className="space-y-4">
        {activeDisputes.map((dispute) => (
          <Card key={dispute.id} className="border-none shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`p-2 rounded-full 
                    ${
                      dispute.category === "payment"
                        ? "bg-primary/10"
                        : dispute.category === "membership"
                          ? "bg-destructive/10"
                          : dispute.category === "rules"
                            ? "bg-secondary/10"
                            : "bg-accent/10"
                    }`}
                  >
                    <AlertCircle
                      className={`h-5 w-5 
                      ${
                        dispute.category === "payment"
                          ? "text-primary"
                          : dispute.category === "membership"
                            ? "text-destructive"
                            : dispute.category === "rules"
                              ? "text-secondary"
                              : "text-accent"
                      }`}
                    />
                  </div>
                  <div>
                    <CardTitle>{dispute.title}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      {dispute.group}
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-accent text-accent-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {dispute.daysLeft} days left
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-muted-foreground mb-4">{dispute.description}</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Avatar className="h-5 w-5 mr-2">
                        <AvatarFallback className="text-[10px]">{dispute.raisedBy.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground">
                        Raised by {dispute.raisedBy} on {new Date(dispute.raisedOn).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {dispute.votesFor + dispute.votesAgainst} of {dispute.totalMembers} voted
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-accent">For: {dispute.votesFor}</span>
                      <span className="text-destructive">Against: {dispute.votesAgainst}</span>
                    </div>
                    <Progress
                      value={((dispute.votesFor + dispute.votesAgainst) / dispute.totalMembers) * 100}
                      className="h-2 bg-muted"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4">
              <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                Vote Against
              </Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Vote For</Button>
            </CardFooter>
          </Card>
        ))}
      </TabsContent>
      <TabsContent value="resolved" className="space-y-4">
        {resolvedDisputes.map((dispute) => (
          <Card key={dispute.id} className="border-none shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`p-2 rounded-full 
                    ${dispute.resolution === "approved" ? "bg-accent/10" : "bg-destructive/10"}`}
                  >
                    <CheckCircle
                      className={`h-5 w-5 
                      ${dispute.resolution === "approved" ? "text-accent" : "text-destructive"}`}
                    />
                  </div>
                  <div>
                    <CardTitle>{dispute.title}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      {dispute.group}
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    dispute.resolution === "approved"
                      ? "border-accent text-accent"
                      : "border-destructive text-destructive"
                  }
                >
                  {dispute.resolution === "approved" ? "Approved" : "Rejected"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-muted-foreground mb-4">{dispute.description}</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Avatar className="h-5 w-5 mr-2">
                        <AvatarFallback className="text-[10px]">{dispute.raisedBy.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground">
                        Raised by {dispute.raisedBy} on {new Date(dispute.raisedOn).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      Resolved on {new Date(dispute.resolvedOn).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-accent">For: {dispute.votesFor}</span>
                      <span className="text-destructive">Against: {dispute.votesAgainst}</span>
                    </div>
                    <Progress
                      value={100}
                      className={`h-2 ${dispute.resolution === "approved" ? "bg-accent" : "bg-destructive/50"}`}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-4">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <MessageSquare className="mr-2 h-4 w-4" />
                View Discussion
              </Button>
            </CardFooter>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  )
}
