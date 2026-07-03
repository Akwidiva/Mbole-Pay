"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import { motion } from "framer-motion"
import { containerVariants, itemVariants, listRowVariants } from "@/lib/animations"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"

function TransactionRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-8" />
      </TableCell>
    </TableRow>
  )
}

export function TransactionsList({ transactions = [], loading = false }) {
  const [page, setPage] = useState(1)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const transactionsPerPage = 7

  useEffect(() => { setPage(1) }, [transactions])

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeBadge = (type) => {
    switch (type.toLowerCase()) {
      case "contribution":
        return "border-green-500 text-green-500"
      case "payout":
        return "border-blue-500 text-blue-500"
      case "fee":
        return "border-orange-500 text-orange-500"
      default:
        return "border-gray-500 text-gray-500"
    }
  }

  const paginatedTransactions = transactions.slice(
    (page - 1) * transactionsPerPage,
    page * transactionsPerPage
  )

  const mapTypeToVariant = (type) => {
    switch ((type || "").toLowerCase()) {
      case "contribution":
        return "secondary"
      case "payout":
        return "destructive"
      case "fee":
        return "default"
      default:
        return "outline"
    }
  }

  const totalPages = Math.ceil(transactions.length / transactionsPerPage)

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate">
      <motion.div variants={itemVariants} className="">
        <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
            <TableHeader className="bg-muted/5">
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wide">Date</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Group</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Type</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Amount</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Reference</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <TransactionRowSkeleton key={i} />)
              ) : paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="group hover:bg-muted/50 transition-colors hover:shadow-sm">
                    <TableCell>{format(new Date(transaction.createdAt), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={transaction.group?.imageUrl} />
                          <AvatarFallback>{transaction.group?.name?.charAt(0) || 'G'}</AvatarFallback>
                        </Avatar>
                        <span>{transaction.group?.name || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={mapTypeToVariant(transaction.type)} className={getTypeBadge(transaction.type)}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={
                        (transaction.type === "payout" || transaction.type === "fine"
                          ? "text-red-600"
                          : "text-green-600") + " font-mono"
                      }
                    >
                      {transaction.type === "payout" ? "+" : "-"}XAF {transaction.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadge(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.reference}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTransaction(transaction)
                            setShowDetails(true)
                          }}
                          aria-label={`View transaction ${transaction.reference}`}
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                      </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" onClick={() => setPage(Math.max(1, page - 1))} />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink href="#" isActive={page === i + 1} onClick={() => setPage(i + 1)}>
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext href="#" onClick={() => setPage(Math.min(totalPages, page + 1))} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      <AlertDialog open={showDetails} onOpenChange={setShowDetails}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transaction Details</AlertDialogTitle>
            <AlertDialogDescription>
              Details for the selected transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedTransaction ? (
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{format(new Date(selectedTransaction.createdAt), "PPpp")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Group</p>
                <p className="font-medium">{selectedTransaction.group?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{selectedTransaction.type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className={selectedTransaction.type === "payout" || selectedTransaction.type === "fine" ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                  {selectedTransaction.type === "payout" ? "+" : "-"}XAF {selectedTransaction.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{selectedTransaction.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reference</p>
                <p className="font-mono text-sm">{selectedTransaction.reference}</p>
              </div>
            </div>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
    </motion.div>
  )
}
