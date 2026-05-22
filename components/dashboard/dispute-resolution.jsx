"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function DisputeResolution() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchDisputes() {
      try {
        setLoading(true)
        const response = await fetch("/api/disputes")
        if (!response.ok) {
          throw new Error("Failed to fetch disputes")
        }
        const data = await response.json()
        setDisputes(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch active disputes.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDisputes()
  }, [toast])

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <CardTitle>Active Disputes</CardTitle>
        <CardDescription>Ongoing disputes requiring your vote.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4 animate-pulse p-4">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-2 bg-muted rounded w-full mb-2"></div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="flex space-x-2">
                  <div className="h-8 bg-muted rounded w-20"></div>
                  <div className="h-8 bg-muted rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
        ) : disputes.length > 0 ? (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div key={dispute.id} className="space-y-2">
                <div>
                  <p className="text-sm font-medium">{dispute.title}</p>
                  <p className="text-xs text-muted-foreground">{dispute.group.name}</p>
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
                  <p className="text-xs text-muted-foreground text-right">
                    {dispute.totalMembers - dispute.votesFor - dispute.votesAgainst} votes remaining
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">{dispute.daysLeft} days left to vote</p>
                  <div className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive/10"
                    >
                      Against
                    </Button>
                    <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                      For
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-[100px] items-center justify-center">
            <p className="text-sm text-muted-foreground">No active disputes</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

