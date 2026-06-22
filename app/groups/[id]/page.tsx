"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsDashboard } from "@/components/analytics";
import { MemberManagement } from "@/components/groups/member-management";
import { GroupSettingsPage } from "@/components/groups/group-settings-page";
import { CycleCard } from "@/components/groups/cycle-card";
import { Users, TrendingUp, Settings, ChevronLeft, DollarSign, Calendar, Mail, FileText, LogOut } from "lucide-react";
import Link from "next/link";
import { GroupReportsTab } from "@/components/groups/group-reports-tab";

interface GroupData {
  id: string;
  name: string;
  description: string;
  status: string;
  contributionAmount: number;
  frequency: string;
  cycleType: string;
  memberships?: Array<{
    userId: string;
    role: "ADMIN" | "MEMBER";
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  _count?: {
    memberships: number;
  };
}

interface AnalyticsMetrics {
  totalContributed: number;
  totalPaidOut: number;
  pendingAmount: number;
  defaultRate: number;
  participationRate: number;
  nextPayoutDate?: string;
  nextPayoutAmount?: number;
}

const VALID_TABS = ["overview", "members", "analytics", "reports", "settings"];

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams?.get("tab");
    return tab && VALID_TABS.includes(tab) ? tab : "overview";
  });

  const groupId = params?.id as string;

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }

    if (groupId) {
      fetchGroup();
      fetchMetrics();
    }
  }, [groupId, session, status, router]);

  async function fetchGroup() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/groups/${groupId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Group not found");
        } else if (response.status === 403) {
          setError("You don't have access to this group");
        } else {
          setError("Failed to load group");
        }
        return;
      }

      const data = await response.json();
      setGroup(data.data);
    } catch (err) {
      console.error("Error fetching group:", err);
      setError("Failed to load group");
    } finally {
      setLoading(false);
    }
  }

  async function fetchMetrics() {
    try {
      setMetricsLoading(true);
      const response = await fetch(`/api/groups/${groupId}/analytics`);

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.data);
      }
    } catch (err) {
      console.error("Error fetching metrics:", err);
    } finally {
      setMetricsLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-4xl px-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-4xl px-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">{error || "Group not found"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {error === "Group not found"
                ? "The group you're looking for doesn't exist."
                : error === "You don't have access to this group"
                  ? "You are not a member of this group."
                  : "An error occurred while loading the group."}
            </p>
            <Link href="/groups" className="w-full">
              <Button variant="outline" className="w-full">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Groups
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CM", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const currentUserId = session?.user?.id;
  const currentUserRole =
    group?.memberships?.find((membership) => membership.userId === currentUserId)?.role || "MEMBER";
  const isAdmin = currentUserRole === "ADMIN";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-6xl mx-auto px-4 py-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/groups">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold">{group.name}</h1>
              <p className="text-muted-foreground mt-1">{group.description}</p>
            </div>
          </div>
          <Badge variant={group.status === "ACTIVE" ? "default" : "secondary"}>
            {group.status}
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-1.5">
              <CardTitle className="text-sm font-medium text-muted-foreground">Members</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <p className="text-2xl font-bold">{group._count?.memberships || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-1.5">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Contribution Amount
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-2xl font-bold">{formatCurrency(group.contributionAmount)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {group.frequency.toLowerCase()} • {group.cycleType.toLowerCase()}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-1.5">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cycle Type</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-2xl font-bold capitalize">{group.cycleType.toLowerCase()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex h-auto w-full flex-wrap gap-2 rounded-xl border bg-muted/60 p-2">
            <TabsTrigger value="overview" className="min-w-[120px] flex-1 rounded-lg data-[state=active]:bg-background">
              Overview
            </TabsTrigger>
            <TabsTrigger value="members" className="min-w-[120px] flex-1 rounded-lg data-[state=active]:bg-background">
              Members
            </TabsTrigger>
            <TabsTrigger value="analytics" className="min-w-[140px] flex-1 rounded-lg data-[state=active]:bg-background">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" className="min-w-[120px] flex-1 rounded-lg data-[state=active]:bg-background">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="settings" className="min-w-[130px] flex-1 rounded-lg data-[state=active]:bg-background">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Cycle / Pay Now card — always first */}
            <CycleCard groupId={groupId} />
            {/* Real-Time Financial Stats */}
            {metricsLoading ? (
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : metrics ? (
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Total Contributions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {new Intl.NumberFormat("fr-CM", {
                        style: "currency",
                        currency: "XAF",
                        minimumFractionDigits: 0,
                      }).format(metrics.totalContributed || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      All members combined
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Your Pending Payout
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-orange-600">
                      {new Intl.NumberFormat("fr-CM", {
                        style: "currency",
                        currency: "XAF",
                        minimumFractionDigits: 0,
                      }).format(metrics.pendingAmount || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Next payout: {metrics.nextPayoutDate ? new Date(metrics.nextPayoutDate).toLocaleDateString() : "TBD"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Total Paid Out
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">
                      {new Intl.NumberFormat("fr-CM", {
                        style: "currency",
                        currency: "XAF",
                        minimumFractionDigits: 0,
                      }).format(metrics.totalPaidOut || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Historical total
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Group Information</CardTitle>
                <CardDescription>Key details about this savings group</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-base font-medium mt-1">{group.description || "No description"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contribution Frequency</p>
                    <p className="text-base font-medium mt-1 capitalize">{group.frequency.toLowerCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cycle Type</p>
                    <p className="text-base font-medium mt-1 capitalize">{group.cycleType.toLowerCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contribution Amount (Per Member)</p>
                    <p className="text-base font-medium mt-1">
                      {new Intl.NumberFormat("fr-CM", {
                        style: "currency",
                        currency: "XAF",
                        minimumFractionDigits: 0,
                      }).format(group.contributionAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <Button className="w-full justify-start gap-2 px-3" onClick={() => setActiveTab("members")}>
                  <Users className="mr-2 h-4 w-4" />
                  View Members
                </Button>
                <Button asChild variant="outline" className="w-full justify-start gap-2 px-3">
                  <Link href={`/groups/invite?groupId=${groupId}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Invite Members
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 px-3" onClick={() => setActiveTab("analytics")}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 px-3" onClick={() => setActiveTab("reports")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Reports &amp; Downloads
                </Button>
                {currentUserRole === "ADMIN" && (
                  <Button variant="outline" className="w-full justify-start gap-2 px-3 sm:col-span-2 lg:col-span-1" onClick={() => setActiveTab("settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Group Settings
                  </Button>
                )}
                {currentUserRole !== "ADMIN" && (
                  <Button variant="outline" className="w-full justify-start gap-2 px-3 sm:col-span-2 lg:col-span-1 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30" onClick={() => setActiveTab("members")}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave Group
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <MemberManagement groupId={groupId} currentUserRole={currentUserRole} currentUserId={currentUserId} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard groupId={groupId} />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <GroupReportsTab groupId={groupId} isAdmin={isAdmin} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <GroupSettingsPage groupId={groupId} onGroupUpdated={fetchGroup} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
