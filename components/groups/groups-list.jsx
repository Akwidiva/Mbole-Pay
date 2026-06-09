"use client"
import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, ArrowUpRight, Settings, MoreHorizontal, LogIn, Plus, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import { containerVariants, itemVariants, tabPanelVariants } from "@/lib/animations"
import { useGroups } from "@/hooks/use-groups"
import { JoinGroupDialog } from "./join-group-dialog"
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
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const { groups, loading, refetch } = useGroups()

  const activeGroups = groups.filter(g => g.status !== 'INACTIVE')
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  if (loading) {
    return (
      <div className="w-full mt-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <>
      <JoinGroupDialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen} />

      <Tabs defaultValue="active" className="w-full mt-6" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="active">Active Groups ({activeGroups.length})</TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="mr-1 h-4 w-4" />
            Create
          </TabsTrigger>
          <TabsTrigger value="join">
            <LogIn className="mr-1 h-4 w-4" />
            Join
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-4">
          {activeGroups.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active groups yet. Join one to get started!</p>
                  <Button onClick={() => setActiveTab('join')} className="mt-4">
                    <LogIn className="mr-2 h-4 w-4" />
                    Browse Groups
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-4">
              {activeGroups.map((group) => (
                <motion.div key={group.id} variants={itemVariants}>
                  <motion.div
                    whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <Card className="border border-secondary/20 shadow-md hover:border-secondary/40 transition-colors rounded-2xl">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12 border-2 border-secondary/30">
                              <AvatarImage src={`/placeholder.svg?height=48&width=48`} alt={group.name} />
                              <AvatarFallback className="bg-secondary text-secondary-foreground">
                                {group.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                              <div>
                              <CardTitle className="text-2xl">{group.name}</CardTitle>
                              <CardDescription className="flex items-center mt-1 text-sm md:text-base">
                                <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                {group._count?.memberships || 0} members
                              </CardDescription>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-5 w-5" />
                                  <span className="sr-only">More options</span>
                                </Button>
                              </motion.div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/groups/${group.id}?tab=overview`}>
                                  View Group Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/groups/${group.id}?tab=members`}>
                                  View Members
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/groups/${group.id}?tab=analytics`}>
                                  <TrendingUp className="mr-2 h-4 w-4" />
                                  View Analytics
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/groups/${group.id}?tab=settings`}>
                                  Group Settings
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Contribution:</span>
                              <span className="text-sm font-medium">{formatCurrency(group.contributionAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Frequency:</span>
                              <span className="text-sm font-medium capitalize">{group.frequency.toLowerCase()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Cycle:</span>
                              <span className="text-sm font-medium capitalize">{group.cycleType.toLowerCase()}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Description:</span>
                              <span className="text-sm font-medium">{group.description || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-4">
                        <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10 hover:border-secondary px-4 py-2 text-sm md:text-base" asChild>
                          <Link href={`/groups/${group.id}?tab=settings`}>
                            <Settings className="mr-2 h-4 w-4" />
                            Manage
                          </Link>
                        </Button>
                        <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/85 font-bold px-4 py-2 text-sm md:text-base" asChild>
                          <Link href={`/groups/${group.id}`}>
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create a New Group</CardTitle>
              <CardDescription>Start a new savings group and invite members</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild size="lg" className="w-full">
                  <Link href="/groups/new">
                    <Plus className="mr-2 h-5 w-5" />
                    Start Creating
                  </Link>
                </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="join" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Join a Savings Group</CardTitle>
              <CardDescription>Enter an invite code to join an existing group</CardDescription>
            </CardHeader>
            <CardContent>
              <JoinGroupDialog open={activeTab === 'join'} onOpenChange={setActiveTab} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
