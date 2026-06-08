import { Metadata } from "next";
import { NotificationSettings } from "@/components/notifications";

export const metadata: Metadata = {
  title: "Notification Settings | Mbole Pay",
};

export default function NotificationSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
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
  );
}
