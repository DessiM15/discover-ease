"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { useCreateEvent } from "@/hooks/use-events";
import { useCases } from "@/hooks/use-cases";
import { useUsers } from "@/hooks/use-users";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

type EventType = "deadline" | "court_date" | "meeting" | "deposition" | "hearing" | "trial" | "reminder" | "other";

const EVENT_TYPES: { value: EventType; label: string; defaultColor: string }[] = [
  { value: "deadline", label: "Deadline", defaultColor: "red" },
  { value: "court_date", label: "Court Date", defaultColor: "red" },
  { value: "meeting", label: "Meeting", defaultColor: "blue" },
  { value: "deposition", label: "Deposition", defaultColor: "blue" },
  { value: "hearing", label: "Hearing", defaultColor: "purple" },
  { value: "trial", label: "Trial", defaultColor: "purple" },
  { value: "reminder", label: "Reminder", defaultColor: "amber" },
  { value: "other", label: "Other", defaultColor: "slate" },
];

const EVENT_COLORS = [
  { value: "red", label: "Red", bg: "bg-red-500" },
  { value: "blue", label: "Blue", bg: "bg-blue-500" },
  { value: "green", label: "Green", bg: "bg-green-500" },
  { value: "amber", label: "Amber", bg: "bg-primary" },
  { value: "purple", label: "Purple", bg: "bg-purple-500" },
  { value: "pink", label: "Pink", bg: "bg-pink-500" },
  { value: "indigo", label: "Indigo", bg: "bg-indigo-500" },
  { value: "teal", label: "Teal", bg: "bg-teal-500" },
  { value: "orange", label: "Orange", bg: "bg-orange-500" },
  { value: "slate", label: "Slate", bg: "bg-slate-500" },
];

const REMINDER_OPTIONS = [
  { value: null, label: "None" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 1440, label: "1 day" },
  { value: 10080, label: "1 week" },
];

export default function NewEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const createEvent = useCreateEvent();

  const { data: firmId } = useQuery({
    queryKey: ["firmId", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("users")
        .select("firm_id")
        .eq("id", user.id)
        .single();
      return data?.firm_id || null;
    },
    enabled: !!user,
  });

  const { data: casesData } = useCases(firmId);
  const cases = casesData?.data ?? [];
  const { data: users = [] } = useUsers(firmId);

  const today = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState<{
    title: string;
    type: EventType;
    case_id: string;
    start_date: string;
    start_time: string;
    end_date: string;
    end_time: string;
    all_day: boolean;
    location: string;
    video_link: string;
    description: string;
    reminder_minutes: number | null;
    is_recurring: boolean;
    recurrence_rule: string;
    color: string;
  }>({
    title: "",
    type: "meeting",
    case_id: "",
    start_date: today,
    start_time: "09:00",
    end_date: today,
    end_time: "10:00",
    all_day: false,
    location: "",
    video_link: "",
    description: "",
    reminder_minutes: null,
    is_recurring: false,
    recurrence_rule: "",
    color: "",
  });

  useEffect(() => {
    if (formData.type && !formData.color) {
      const eventType = EVENT_TYPES.find((t) => t.value === formData.type);
      if (eventType?.defaultColor) {
        setFormData((prev) => ({ ...prev, color: eventType.defaultColor }));
      }
    }
  }, [formData.type, formData.color]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startDate = new Date(`${formData.start_date}T${formData.start_time}`);
    const endDate = formData.all_day
      ? new Date(`${formData.end_date}T23:59:59`)
      : new Date(`${formData.end_date}T${formData.end_time}`);

    try {
      await createEvent.mutateAsync({
        title: formData.title,
        type: formData.type,
        caseId: formData.case_id || null,
        startDate: startDate,
        endDate: endDate,
        allDay: formData.all_day,
        location: formData.location || null,
        videoLink: formData.video_link || null,
        description: formData.description || null,
        reminderMinutes: formData.reminder_minutes ? [formData.reminder_minutes] : null,
        isRecurring: formData.is_recurring,
        recurrenceRule: formData.recurrence_rule || null,
        color: formData.color || null,
        firmId: firmId,
        createdById: user?.id,
      });
      toast.success("Event created successfully");
      router.push("/calendar");
    } catch (error) {
      toast.error("Failed to create event");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/calendar">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">New Event</h1>
          <p className="mt-1 text-muted-foreground">Create a new calendar event</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Event Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as EventType })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="case">Case (Optional)</Label>
            <Select
              value={formData.case_id || "none"}
              onValueChange={(value) => setFormData({ ...formData, case_id: value === "none" ? "" : value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a case" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.caseNumber} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Event Color</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {EVENT_COLORS.map((colorOption) => {
              const isSelected = formData.color === colorOption.value || 
                (!formData.color && EVENT_TYPES.find(t => t.value === formData.type)?.defaultColor === colorOption.value);
              return (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: colorOption.value })}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-primary scale-110"
                      : "border-border hover:border-border"
                  }`}
                  title={colorOption.label}
                >
                  <div className={`h-6 w-6 rounded-full ${colorOption.bg}`} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="all_day"
            checked={formData.all_day}
            onCheckedChange={(checked) => setFormData({ ...formData, all_day: checked })}
          />
          <Label htmlFor="all_day">All Day</Label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Start Date *</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
              className="mt-1"
            />
          </div>
          {!formData.all_day && (
            <div>
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="mt-1"
              />
            </div>
          )}
        </div>

        {!formData.all_day && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Physical location or address"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="video_link">Video Link</Label>
          <Input
            id="video_link"
            value={formData.video_link}
            onChange={(e) => setFormData({ ...formData, video_link: e.target.value })}
            placeholder="Zoom, Teams, or other video link"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="reminder">Reminder</Label>
          <Select
            value={formData.reminder_minutes?.toString() || "none"}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                reminder_minutes: value === "none" ? null : parseInt(value),
              })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REMINDER_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value?.toString() || "none"}
                  value={option.value?.toString() || "none"}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_recurring"
            checked={formData.is_recurring}
            onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
          />
          <Label htmlFor="is_recurring">Recurring Event</Label>
        </div>

        {formData.is_recurring && (
          <div>
            <Label htmlFor="recurrence_rule">Recurrence Pattern</Label>
            <Select
              value={formData.recurrence_rule}
              onValueChange={(value) => setFormData({ ...formData, recurrence_rule: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select pattern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/calendar">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createEvent.isPending}>
            {createEvent.isPending ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </form>
    </div>
  );
}

