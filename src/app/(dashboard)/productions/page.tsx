import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProductionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Productions</h1>
        <p className="mt-1 text-slate-400">Manage document productions and privilege logs</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Productions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">Production management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

