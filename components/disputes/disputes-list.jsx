"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle, Clock, Users, MessageSquare } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"

function DisputeRowSkeleton() {
  return (
    <Card className="border border-secondary/20 shadow-md">
      <CardHeader className="pb-2 border-b border-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-32 mt-2" />
            </div>
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  )
}

export function DisputesList() {
  const [activeTab, setActiveTab] = useState("active")
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDisputes() {
      setLoading(true)
      try {
        const response = await fetch("/api/disputes")
        if (response.ok) {
          const data = await response.json()
          setDisputes(data)
        } else {
          console.error("Failed to fetch disputes")
        }
      } catch (error) {
        console.error("Error fetching disputes:", error)
      }
      setLoading(false)
    }
    fetchDisputes()
  }, [])

  const activeDisputes = disputes.filter((d) => d.status === "OPEN")
  const resolvedDisputes = disputes.filter((d) => d.status !== "OPEN")

  return (
    <Tabs defaultValue="active" className="w-full mt-6" onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="active">Active Disputes</TabsTrigger>
        <TabsTrigger value="resolved">Resolved Disputes</TabsTrigger>
      </TabsList>
      <TabsContent value="active" className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <DisputeRowSkeleton key={i} />)
        ) : activeDisputes.length > 0 ? (
          activeDisputes.map((dispute) => (
            <Card key={dispute.id} className="border border-secondary/20 shadow-md hover:border-secondary/40 transition-colors">
              <CardHeader className="pb-2 border-b border-secondary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-full bg-primary/10">
                      <AlertCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{dispute.title}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        {dispute.group}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-secondary text-secondary-foreground font-bold">
                    <Clock className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground mb-4">{dispute.description}</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Created {format(new Date(dispute.createdAt), "MMM dd, yyyy")}
                      </span>
                      <span className="text-muted-foreground">
                        {dispute.votesFor + dispute.votesAgainst} of {dispute.totalMembers} voted
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-secondary font-bold">For: {dispute.votesFor}</span>
                        <span className="text-destructive">Against: {dispute.votesAgainst}</span>
                      </div>
                      <Progress
                        value={
                          dispute.totalMembers > 0
                            ? ((dispute.votesFor + dispute.votesAgainst) / dispute.totalMembers) * 100
                            : 0
                        }
                        className="h-2 bg-muted"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-4 border-t border-secondary/10">
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                  Vote Against
                </Button>
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/85 font-bold">Vote For</Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No active disputes</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
      <TabsContent value="resolved" className="space-y-4">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => <DisputeRowSkeleton key={i} />)
        ) : resolvedDisputes.length > 0 ? (
          resolvedDisputes.map((dispute) => (
            <Card key={dispute.id} className="border border-secondary/20 shadow-md hover:border-secondary/40 transition-colors opacity-75">
              <CardHeader className="pb-2 border-b border-secondary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-full bg-green-100">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>{dispute.title}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        {dispute.group}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 font-bold">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Resolved
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground mb-4">{dispute.description}</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Resolved {format(new Date(dispute.updatedAt), "MMM dd, yyyy")}
                      </span>
                      <span className="text-muted-foreground">
                        {dispute.votesFor + dispute.votesAgainst} of {dispute.totalMembers} voted
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-secondary font-bold">For: {dispute.votesFor}</span>
                        <span className="text-destructive">Against: {dispute.votesAgainst}</span>
                      </div>
                      <Progress
                        value={
                          dispute.totalMembers > 0
                            ? ((dispute.votesFor + dispute.votesAgainst) / dispute.totalMembers) * 100
                            : 0
                        }
                        className="h-2 bg-muted"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No resolved disputes</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  )
}
