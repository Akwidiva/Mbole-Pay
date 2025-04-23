"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

export function TransactionsList() {
  const [page, setPage] = useState(1)

  const transactions = [
    {
      id: "1",
      group: "Mbole Savings Group",
      amount: "₦ 50,000",
      date: "2023-04-05",
      status: "completed",
      type: "contribution",
      reference: "TRX-12345",
      method: "Bank Transfer",
    },
    {
      id: "2",
      group: "Family Support Group",
      amount: "₦ 25,000",
      date: "2023-04-03",
      status: "completed",
      type: "contribution",
      reference: "TRX-12346",
      method: "Mobile Money",
    },
    {
      id: "3",
      group: "Mbole Savings Group",
      amount: "₦ 200,000",
      date: "2023-03-28",
      status: "completed",
      type: "payout",
      reference: "TRX-12347",
      method: "Bank Transfer",
    },
    {
      id: "4",
      group: "Business Investment Group",
      amount: "₦ 75,000",
      date: "2023-03-25",
      status: "pending",
      type: "contribution",
      reference: "TRX-12348",
      method: "Card Payment",
    },
    {
      id: "5",
      group: "Family Support Group",
      amount: "₦ 25,000",
      date: "2023-03-20",
      status: "failed",
      type: "contribution",
      reference: "TRX-12349",
      method: "Mobile Money",
    },
    {
      id: "6",
      group: "Mbole Savings Group",
      amount: "₦ 5,000",
      date: "2023-03-15",
      status: "completed",
      type: "fee",
      reference: "TRX-12350",
      method: "Automatic Deduction",
    },
    {
      id: "7",
      group: "Business Investment Group",
      amount: "₦ 150,000",
      date: "2023-03-10",
      status: "completed",
      type: "payout",
      reference: "TRX-12351",
      method: "Bank Transfer",
    },
    {
      id: "8",
      group: "Family Support Group",
      amount: "₦ 25,000",
      date: "2023-03-05",
      status: "completed",
      type: "contribution",
      reference: "TRX-12352",
      method: "Mobile Money",
    },
  ]

  return (
    <Card className="border-none shadow-md mt-4">
      <CardHeader className="pb-2">
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{new Date(transaction.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={`/placeholder.svg?height=24&width=24`} alt={transaction.group} />
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {transaction.group.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{transaction.group}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      transaction.type === "contribution"
                        ? "border-primary text-primary"
                        : transaction.type === "payout"
                          ? "border-secondary text-secondary-foreground"
                          : "border-muted-foreground text-muted-foreground"
                    }
                  >
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell
                  className={
                    transaction.type === "payout"
                      ? "text-secondary-foreground font-medium"
                      : transaction.type === "fee"
                        ? "text-destructive font-medium"
                        : "font-medium"
                  }
                >
                  {transaction.type === "payout" ? "+" : "-"}
                  {transaction.amount}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      transaction.status === "completed"
                        ? "default"
                        : transaction.status === "pending"
                          ? "outline"
                          : "destructive"
                    }
                    className={
                      transaction.status === "completed"
                        ? "bg-accent text-accent-foreground hover:bg-accent/80"
                        : transaction.status === "pending"
                          ? "border-accent text-accent hover:bg-accent/10"
                          : ""
                    }
                  >
                    {transaction.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{transaction.reference}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View details</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </CardContent>
    </Card>
  )
}
