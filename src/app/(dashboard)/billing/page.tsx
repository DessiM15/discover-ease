import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Time & Billing</h1>
        <p className="mt-1 text-slate-400">Track time, expenses, and generate invoices</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">Billing management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

