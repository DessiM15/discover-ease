"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ArrowLeft, Video, MapPin } from "lucide-react";
import { useEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/use-events";
import { useCases } from "@/hooks/use-cases";
import { useUsers } from "@/hooks/use-users";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

const EVENT_TYPES = [
  { value: "deadline", label: "Deadline" },
  { value: "court_date", label: "Court Date" },
  { value: "meeting", label: "Meeting" },
  { value: "deposition", label: "Deposition" },
  { value: "hearing", label: "Hearing" },
  { value: "trial", label: "Trial" },
  { value: "reminder", label: "Reminder" },
  { value: "task_due", label: "Task Due" },
  { value: "other", label: "Other" },
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

function getEventColor(event: any) {
  if (event.color) {
    const colorOption = EVENT_COLORS.find((c) => c.value === event.color);
    return colorOption || EVENT_COLORS[0];
  }
  return EVENT_COLORS[0];
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [id, setId] = useState<string>("");
  
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);
  
  const { data: event, isLoading } = useEvent(id);
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

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

  const eventType = event ? EVENT_TYPES.find((t) => t.value === event.type) : null;
  const eventColor = event ? getEventColor(event) : null;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    if (!event?.isTask) {
      try {
        await deleteEvent.mutateAsync(id);
        toast.success("Event deleted successfully");
        router.push("/calendar");
      } catch (error) {
        toast.error("Failed to delete event");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center text-muted-foreground">Event not found</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/calendar">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {eventColor && <div className={cn("h-3 w-3 rounded-full", eventColor.bg)} />}
            <div>
              <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
              <p className="mt-1 text-muted-foreground">
                {eventType?.label || "Event"} •{" "}
                {new Date(event.start_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
        {!event.isTask && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/calendar/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4 max-w-2xl">
        {event.cases && (
          <div>
            <Label>Case</Label>
            <p className="text-sm text-foreground mt-1">{event.cases.name}</p>
          </div>
        )}

        <div>
          <Label>Time</Label>
          <p className="text-sm text-foreground mt-1">
            {event.all_day ? (
              "All Day"
            ) : (
              <>
                {new Date(event.start_date).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {event.end_date &&
                  ` - ${new Date(event.end_date).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}`}
              </>
            )}
          </p>
        </div>

        {event.location && (
          <div>
            <Label>Location</Label>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-foreground">{event.location}</p>
            </div>
          </div>
        )}

        {event.video_link && (
          <div>
            <Label>Video Link</Label>
            <a
              href={event.video_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline mt-1"
            >
              <Video className="h-4 w-4" />
              Join Video Call
            </a>
          </div>
        )}

        {event.description && (
          <div>
            <Label>Description</Label>
            <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}










