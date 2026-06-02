"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Bell, Mail } from "lucide-react";
import { toast } from "sonner";

interface NotificationPreferences {
  userId?: string;
  emailPaymentSuccess?: boolean;
  emailPaymentFailed?: boolean;
  emailPayoutScheduled?: boolean;
  emailDisputeFiled?: boolean;
  emailVotingReminder?: boolean;
  emailContributionReminder?: boolean;
  notificationQuietHours?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export function NotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<NotificationPreferences>({});

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications/preferences");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to fetch preferences");
      }

      setPrefs(result.data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prefs),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to save preferences");
      }

      toast.success("Notification preferences updated");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  function updatePref(key: string, value: any) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Email Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>Receive important updates via email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-payment-success">Payment Confirmed</Label>
            <Switch
              id="email-payment-success"
              checked={prefs.emailPaymentSuccess}
              onCheckedChange={(checked) =>
                updatePref("emailPaymentSuccess", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="email-payment-failed">Payment Failed</Label>
            <Switch
              id="email-payment-failed"
              checked={prefs.emailPaymentFailed}
              onCheckedChange={(checked) =>
                updatePref("emailPaymentFailed", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="email-payout-scheduled">Payout Scheduled</Label>
            <Switch
              id="email-payout-scheduled"
              checked={prefs.emailPayoutScheduled}
              onCheckedChange={(checked) =>
                updatePref("emailPayoutScheduled", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="email-dispute-filed">New Dispute Filed</Label>
            <Switch
              id="email-dispute-filed"
              checked={prefs.emailDisputeFiled}
              onCheckedChange={(checked) =>
                updatePref("emailDisputeFiled", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="email-voting-reminder">Voting Reminder</Label>
            <Switch
              id="email-voting-reminder"
              checked={prefs.emailVotingReminder}
              onCheckedChange={(checked) =>
                updatePref("emailVotingReminder", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="email-contribution-reminder">
              Contribution Reminder
            </Label>
            <Switch
              id="email-contribution-reminder"
              checked={prefs.emailContributionReminder}
              onCheckedChange={(checked) =>
                updatePref("emailContributionReminder", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            All notifications are delivered via email for reliable delivery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Keep email notifications enabled to receive payment and payout updates.
          </p>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>Don't send notifications during these hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
            <Switch
              id="quiet-hours"
              checked={prefs.notificationQuietHours}
              onCheckedChange={(checked) =>
                updatePref("notificationQuietHours", checked)
              }
            />
          </div>

          {prefs.notificationQuietHours && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quiet-hours-start">Start Time</Label>
                  <Input
                    id="quiet-hours-start"
                    type="time"
                    value={prefs.quietHoursStart || "22:00"}
                    onChange={(e) =>
                      updatePref("quietHoursStart", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="quiet-hours-end">End Time</Label>
                  <Input
                    id="quiet-hours-end"
                    type="time"
                    value={prefs.quietHoursEnd || "08:00"}
                    onChange={(e) => updatePref("quietHoursEnd", e.target.value)}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Example: 22:00 to 08:00 = no notifications between 10 PM and 8
                AM
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save Preferences"}
      </Button>
    </div>
  );
}
