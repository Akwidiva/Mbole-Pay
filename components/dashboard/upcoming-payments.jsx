"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function UpcomingPayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchUpcomingPayments() {
      try {
        setLoading(true)
        const response = await fetch("/api/dashboard/upcoming-payments")
        if (!response.ok) {
          throw new Error("Failed to fetch upcoming payments")
        }
        const data = await response.json()
        setPayments(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch upcoming payments.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUpcomingPayments()
  }, [toast])

  return (
    <Card className="border border-secondary/20 shadow-md">
      <CardHeader className="border-b border-secondary/10">
        <CardTitle>Upcoming Payments</CardTitle>
        <CardDescription>Your scheduled contributions for this month.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4 animate-pulse p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-2 pb-3 border-b border-secondary/10 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-8 bg-muted rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : payments.length > 0 ? (
          <div className="space-y-4 pt-4">
            {payments.map((payment, index) => (
              <div 
                key={payment.id} 
                className={`flex flex-col space-y-2 pb-3 ${index !== payments.length - 1 ? 'border-b border-secondary/10' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{payment.group.name}</p>
                  <p className="text-sm font-bold text-secondary">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'XAF' }).format(payment.amount)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className={`h-4 w-4 ${payment.daysLeft <= 5 ? 'text-secondary' : 'text-muted-foreground'}`} />
                    <p className={`text-xs ${payment.daysLeft <= 5 ? 'text-secondary font-bold' : 'text-muted-foreground'}`}>
                      Due in {payment.daysLeft} days
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={payment.daysLeft <= 5 ? "default" : "outline"}
                    className={
                      payment.daysLeft <= 5 
                        ? "bg-secondary text-secondary-foreground hover:bg-secondary/85 font-bold" 
                        : "border-secondary text-secondary hover:bg-secondary/5"
                    }
                  >
                    Pay Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-[100px] items-center justify-center">
            <p className="text-sm text-muted-foreground">No upcoming payments.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

