import { Metadata } from "next";
import { NotificationSettings } from "@/components/notifications";
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Notification Settings | Mbole Pay",
};

export default function NotificationSettingsPage() {
  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-4xl px-0 py-2 sm:px-0 lg:px-0">
        <div className="mb-4 space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Notifications
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
          <p className="text-muted-foreground">
            Control which email updates you receive and when Mbole Pay should stay quiet.
          </p>
        </div>
        <NotificationSettings />
      </div>
    </DashboardShell>
  );
}
