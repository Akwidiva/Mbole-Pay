import { PendingDisputes } from "@/components/admin/pending-disputes"

export default function AdminDisputesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Manage Disputes</h1>
      <PendingDisputes />
    </div>
  )
}
