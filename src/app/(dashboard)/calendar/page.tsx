import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Calendar</h1>
        <p className="mt-1 text-slate-400">View deadlines, court dates, and events</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">Calendar view coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

