"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Video,
  X,
  Edit,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/use-events";
import { useTasks } from "@/hooks/use-tasks";
import { useCases } from "@/hooks/use-cases";
import { useUsers } from "@/hooks/use-users";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

type ViewType = "month" | "week" | "day";

const EVENT_TYPES = [
  { value: "deadline", label: "Deadline", color: "bg-red-500", defaultColor: "red" },
  { value: "court_date", label: "Court Date", color: "bg-red-500", defaultColor: "red" },
  { value: "meeting", label: "Meeting", color: "bg-blue-500", defaultColor: "blue" },
  { value: "deposition", label: "Deposition", color: "bg-blue-500", defaultColor: "blue" },
  { value: "hearing", label: "Hearing", color: "bg-purple-500", defaultColor: "purple" },
  { value: "trial", label: "Trial", color: "bg-purple-500", defaultColor: "purple" },
  { value: "reminder", label: "Reminder", color: "bg-amber-500", defaultColor: "amber" },
  { value: "task_due", label: "Task Due", color: "bg-amber-500", defaultColor: "amber" },
  { value: "other", label: "Other", color: "bg-slate-500", defaultColor: "slate" },
];

const EVENT_COLORS = [
  { value: "red", label: "Red", bg: "bg-red-500", border: "border-red-500", bgHighlight: "bg-red-500/20" },
  { value: "blue", label: "Blue", bg: "bg-blue-500", border: "border-blue-500", bgHighlight: "bg-blue-500/20" },
  { value: "green", label: "Green", bg: "bg-green-500", border: "border-green-500", bgHighlight: "bg-green-500/20" },
  { value: "amber", label: "Amber", bg: "bg-amber-500", border: "border-amber-500", bgHighlight: "bg-amber-500/20" },
  { value: "purple", label: "Purple", bg: "bg-purple-500", border: "border-purple-500", bgHighlight: "bg-purple-500/20" },
  { value: "pink", label: "Pink", bg: "bg-pink-500", border: "border-pink-500", bgHighlight: "bg-pink-500/20" },
  { value: "indigo", label: "Indigo", bg: "bg-indigo-500", border: "border-indigo-500", bgHighlight: "bg-indigo-500/20" },
  { value: "teal", label: "Teal", bg: "bg-teal-500", border: "border-teal-500", bgHighlight: "bg-teal-500/20" },
  { value: "orange", label: "Orange", bg: "bg-orange-500", border: "border-orange-500", bgHighlight: "bg-orange-500/20" },
  { value: "slate", label: "Slate", bg: "bg-slate-500", border: "border-slate-500", bgHighlight: "bg-slate-500/20" },
];

// Helper function to get event color
function getEventColor(event: any) {
  if (event.color) {
    const colorOption = EVENT_COLORS.find((c) => c.value === event.color);
    return colorOption || EVENT_COLORS[0];
  }
  const eventType = EVENT_TYPES.find((t) => t.value === event.type);
  const defaultColor = eventType?.defaultColor || "slate";
  const colorOption = EVENT_COLORS.find((c) => c.value === defaultColor);
  return colorOption || EVENT_COLORS[0];
}

const REMINDER_OPTIONS = [
  { value: null, label: "None" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 1440, label: "1 day" },
  { value: 10080, label: "1 week" },
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);

  // Get firm ID
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

  // Get events for the current month/week/day
  const startOfPeriod = useMemo(() => {
    const date = new Date(currentDate);
    if (view === "month") {
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
    } else if (view === "week") {
      const day = date.getDay();
      date.setDate(date.getDate() - day);
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return date;
  }, [currentDate, view]);

  const endOfPeriod = useMemo(() => {
    const date = new Date(startOfPeriod);
    if (view === "month") {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      date.setHours(23, 59, 59, 999);
    } else if (view === "week") {
      date.setDate(date.getDate() + 6);
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(23, 59, 59, 999);
    }
    return date;
  }, [startOfPeriod, view]);

  const { data: events = [] } = useEvents(firmId, {
    startDate: startOfPeriod,
    endDate: endOfPeriod,
  });

  const { data: tasks = [] } = useTasks(firmId, {
    dueDate: endOfPeriod,
  });

  const { data: cases = [] } = useCases(firmId);
  const { data: users = [] } = useUsers(firmId);

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  // Combine events and tasks
  const allEvents = useMemo(() => {
    const eventList = events.map((e: any) => ({
      ...e,
      isTask: false,
    }));

    const taskList = tasks
      .filter((t: any) => t.due_date && t.status !== "completed")
      .map((t: any) => ({
        id: t.id,
        title: t.title,
        type: "task_due",
        start_date: t.due_date,
        end_date: t.due_date,
        all_day: false,
        description: t.description,
        case_id: t.case_id,
        cases: t.cases,
        isTask: true,
        task: t,
      }));

    return [...eventList, ...taskList];
  }, [events, tasks]);

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return allEvents.filter((event: any) => {
      const eventDate = new Date(event.start_date).toISOString().split("T")[0];
      return eventDate === dateStr;
    });
  };

  const getUpcomingDeadlines = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return allEvents
      .filter((event: any) => {
        const eventDate = new Date(event.start_date);
        return (
          (event.type === "deadline" || event.type === "court_date") &&
          eventDate >= today
        );
      })
      .sort((a: any, b: any) => {
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      })
      .slice(0, 10);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const formatWeekRange = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Calendar</h1>
          <p className="mt-1 text-slate-400">View deadlines, court dates, and events</p>
        </div>
        <Button onClick={() => setIsNewEventOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Event
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="ml-4 text-lg font-semibold text-white">
            {view === "month" && formatDate(currentDate)}
            {view === "week" && formatWeekRange(currentDate)}
            {view === "day" &&
              currentDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("month")}
          >
            Month
          </Button>
          <Button
            variant={view === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("week")}
          >
            Week
          </Button>
          <Button
            variant={view === "day" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("day")}
          >
            Day
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className={cn("lg:col-span-3", view === "day" && "lg:col-span-4")}>
          <Card>
            <CardContent className="p-0">
              {view === "month" && (
                <MonthView
                  currentDate={currentDate}
                  events={allEvents}
                  onDateClick={(date) => {
                    setSelectedDate(date);
                    setIsDayDetailOpen(true);
                  }}
                  onEventClick={(event) => {
                    setSelectedEvent(event);
                    setIsEventDetailOpen(true);
                  }}
                />
              )}
              {view === "week" && (
                <WeekView
                  currentDate={currentDate}
                  events={allEvents}
                  onDateClick={(date) => {
                    setSelectedDate(date);
                    setIsDayDetailOpen(true);
                  }}
                  onEventClick={(event) => {
                    setSelectedEvent(event);
                    setIsEventDetailOpen(true);
                  }}
                />
              )}
              {view === "day" && (
                <DayView
                  currentDate={currentDate}
                  events={allEvents}
                  onEventClick={(event) => {
                    setSelectedEvent(event);
                    setIsEventDetailOpen(true);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {view !== "day" && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getUpcomingDeadlines().length === 0 ? (
                    <p className="text-sm text-slate-400">No upcoming deadlines</p>
                  ) : (
                    getUpcomingDeadlines().map((event: any) => {
                      const eventDate = new Date(event.start_date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const daysUntil = Math.ceil(
                        (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                      );
                      const isOverdue = daysUntil < 0;

                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "cursor-pointer rounded-lg border border-slate-800 p-3 transition-colors hover:bg-slate-800",
                            isOverdue && "border-red-500 bg-red-500/10"
                          )}
                          onClick={() => {
                            setSelectedEvent(event);
                            setIsEventDetailOpen(true);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{event.title}</p>
                              {event.cases && (
                                <p className="text-xs text-slate-400">{event.cases.name}</p>
                              )}
                              <p
                                className={cn(
                                  "mt-1 text-xs",
                                  isOverdue ? "text-red-400" : "text-slate-400"
                                )}
                              >
                                {isOverdue
                                  ? `${Math.abs(daysUntil)} days overdue`
                                  : daysUntil === 0
                                    ? "Today"
                                    : `${daysUntil} days until`}
                              </p>
                            </div>
                            <div
                              className={cn(
                                "h-2 w-2 rounded-full",
                                getEventColor(event).bg
                              )}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* New Event Modal */}
      <NewEventModal
        open={isNewEventOpen}
        onOpenChange={setIsNewEventOpen}
        cases={cases}
        users={users}
        onCreate={(data) => {
          createEvent.mutate(
            {
              ...data,
              firm_id: firmId,
              created_by_id: user?.id,
            },
            {
              onSuccess: () => {
                setIsNewEventOpen(false);
              },
            }
          );
        }}
      />

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          open={isEventDetailOpen}
          onOpenChange={setIsEventDetailOpen}
          event={selectedEvent}
          cases={cases}
          users={users}
          onEdit={() => {
            setIsEventDetailOpen(false);
            setIsNewEventOpen(true);
          }}
          onDelete={() => {
            if (!selectedEvent.isTask) {
              deleteEvent.mutate(selectedEvent.id, {
                onSuccess: () => {
                  setIsEventDetailOpen(false);
                  setSelectedEvent(null);
                },
              });
            }
          }}
          onUpdate={(data) => {
            if (!selectedEvent.isTask) {
              updateEvent.mutate(
                { id: selectedEvent.id, ...data },
                {
                  onSuccess: () => {
                    setIsEventDetailOpen(false);
                  },
                }
              );
            }
          }}
        />
      )}

      {/* Day Detail Panel */}
      {selectedDate && (
        <DayDetailPanel
          open={isDayDetailOpen}
          onOpenChange={setIsDayDetailOpen}
          date={selectedDate}
          events={getEventsForDate(selectedDate)}
          onEventClick={(event) => {
            setSelectedEvent(event);
            setIsDayDetailOpen(false);
            setIsEventDetailOpen(true);
          }}
          onNewEvent={() => {
            setIsDayDetailOpen(false);
            setIsNewEventOpen(true);
          }}
        />
      )}
    </div>
  );
}

// Month View Component
function MonthView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
}: {
  currentDate: Date;
  events: any[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: any) => void;
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="p-4">
      <div className="grid grid-cols-7 gap-1">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-semibold text-slate-400">
            {day}
          </div>
        ))}
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = date.toISOString().split("T")[0];
          const dayEvents = events.filter((event: any) => {
            const eventDate = new Date(event.start_date).toISOString().split("T")[0];
            return eventDate === dateStr;
          });
          const isToday = date.toISOString().split("T")[0] === today.toISOString().split("T")[0];

          return (
            <div
              key={date.toISOString()}
              className={cn(
                "aspect-square cursor-pointer rounded-lg border border-slate-800 p-2 transition-colors hover:bg-slate-800",
                isToday && "border-amber-500 bg-amber-500/10"
              )}
              onClick={() => onDateClick(date)}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isToday ? "text-amber-500" : "text-white"
                  )}
                >
                  {date.getDate()}
                </span>
              </div>
              <div className="mt-1 flex flex-col gap-1">
                {dayEvents.slice(0, 3).map((event: any) => {
                  const eventColor = getEventColor(event);
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "flex items-center gap-1.5 cursor-pointer rounded px-1.5 py-0.5 transition-colors border-l-2",
                        eventColor.border,
                        eventColor.bgHighlight,
                        "hover:opacity-80"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      <span className="text-xs text-white truncate flex-1 min-w-0">
                        {event.title}
                      </span>
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-slate-400 px-1.5">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Week View Component
function WeekView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
}: {
  currentDate: Date;
  events: any[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: any) => void;
}) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + i);
    weekDays.push(date);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="p-4">
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date) => {
          const dateStr = date.toISOString().split("T")[0];
          const dayEvents = events.filter((event: any) => {
            const eventDate = new Date(event.start_date).toISOString().split("T")[0];
            return eventDate === dateStr;
          });
          const isToday = date.toISOString().split("T")[0] === today.toISOString().split("T")[0];

          return (
            <div key={date.toISOString()} className="flex flex-col">
              <div
                className={cn(
                  "mb-2 cursor-pointer rounded-lg border border-slate-800 p-2 text-center transition-colors hover:bg-slate-800",
                  isToday && "border-amber-500 bg-amber-500/10"
                )}
                onClick={() => onDateClick(date)}
              >
                <div className="text-xs text-slate-400">{DAYS_OF_WEEK[date.getDay()]}</div>
                <div
                  className={cn(
                    "text-lg font-semibold",
                    isToday ? "text-amber-500" : "text-white"
                  )}
                >
                  {date.getDate()}
                </div>
              </div>
              <div className="flex-1 space-y-1">
                {dayEvents.map((event: any) => {
                  const eventColor = getEventColor(event);
                  const startTime = event.all_day
                    ? "All Day"
                    : new Date(event.start_date).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      });
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "cursor-pointer rounded border-l-4 p-2 text-xs transition-colors hover:bg-slate-800",
                        eventColor.border
                      )}
                      onClick={() => onEventClick(event)}
                    >
                      <div className="font-medium text-white">{event.title}</div>
                      <div className="text-slate-400">{startTime}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Day View Component
function DayView({
  currentDate,
  events,
  onEventClick,
}: {
  currentDate: Date;
  events: any[];
  onEventClick: (event: any) => void;
}) {
  const dateStr = currentDate.toISOString().split("T")[0];
  const dayEvents = events.filter((event: any) => {
    const eventDate = new Date(event.start_date).toISOString().split("T")[0];
    return eventDate === dateStr;
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="p-4">
      <div className="flex">
        <div className="w-20 flex-shrink-0">
          {hours.map((hour) => (
            <div key={hour} className="h-16 border-b border-slate-800">
              <div className="text-xs text-slate-400">
                {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1">
          {hours.map((hour) => (
            <div key={hour} className="h-16 border-b border-slate-800">
              {dayEvents
                .filter((event: any) => {
                  if (event.all_day) return hour === 0;
                  const eventHour = new Date(event.start_date).getHours();
                  return eventHour === hour;
                })
                .map((event: any) => {
                  const eventColor = getEventColor(event);
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "mb-1 cursor-pointer rounded border-l-4 p-2 text-sm transition-colors hover:bg-slate-800",
                        eventColor.border
                      )}
                      onClick={() => onEventClick(event)}
                    >
                      <div className="font-medium text-white">{event.title}</div>
                      {!event.all_day && (
                        <div className="text-xs text-slate-400">
                          {new Date(event.start_date).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {event.end_date &&
                            ` - ${new Date(event.end_date).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}`}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// New Event Modal
function NewEventModal({
  open,
  onOpenChange,
  cases,
  users,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cases: any[];
  users: any[];
  onCreate: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    title: "",
    type: "meeting",
    case_id: "",
    start_date: new Date().toISOString().split("T")[0],
    start_time: "09:00",
    end_date: new Date().toISOString().split("T")[0],
    end_time: "10:00",
    all_day: false,
    location: "",
    video_link: "",
    description: "",
    reminder_minutes: null as number | null,
    is_recurring: false,
    recurrence_rule: "",
    color: "",
  });

  // Set default color when type changes
  useEffect(() => {
    if (formData.type && !formData.color) {
      const eventType = EVENT_TYPES.find((t) => t.value === formData.type);
      if (eventType?.defaultColor) {
        setFormData((prev) => ({ ...prev, color: eventType.defaultColor }));
      }
    }
  }, [formData.type, formData.color]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const startDate = new Date(`${formData.start_date}T${formData.start_time}`);
    const endDate = formData.all_day
      ? new Date(`${formData.end_date}T23:59:59`)
      : new Date(`${formData.end_date}T${formData.end_time}`);

    onCreate({
      title: formData.title,
      type: formData.type,
      case_id: formData.case_id || null,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      all_day: formData.all_day,
      location: formData.location || null,
      video_link: formData.video_link || null,
      description: formData.description || null,
      reminder_minutes: formData.reminder_minutes ? [formData.reminder_minutes] : null,
      is_recurring: formData.is_recurring,
      recurrence_rule: formData.recurrence_rule || null,
      color: formData.color || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Event</DialogTitle>
          <DialogDescription>Create a new calendar event</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Event Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
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
                <SelectTrigger>
                  <SelectValue placeholder="Select a case" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.case_number} - {c.name}
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
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all",
                      isSelected
                        ? `${colorOption.border} border-2 scale-110`
                        : "border-slate-800 hover:border-slate-700"
                    )}
                    title={colorOption.label}
                  >
                    <div className={cn("h-6 w-6 rounded-full", colorOption.bg)} />
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div
                className={cn(
                  "h-4 w-4 rounded-full",
                  formData.color
                    ? EVENT_COLORS.find((c) => c.value === formData.color)?.bg
                    : EVENT_COLORS.find((c) => c.value === EVENT_TYPES.find((t) => t.value === formData.type)?.defaultColor)?.bg ||
                      "bg-slate-500"
                )}
              />
              <p className="text-xs text-slate-400">
                Preview: This color will appear on the calendar
              </p>
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
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
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
            />
          </div>

          <div>
            <Label htmlFor="video_link">Video Link</Label>
            <Input
              id="video_link"
              value={formData.video_link}
              onChange={(e) => setFormData({ ...formData, video_link: e.target.value })}
              placeholder="Zoom, Teams, or other video link"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
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
              <SelectTrigger>
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
                <SelectTrigger>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Event</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Event Detail Modal
function EventDetailModal({
  open,
  onOpenChange,
  event,
  cases,
  users,
  onEdit,
  onDelete,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: any;
  cases: any[];
  users: any[];
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (data: any) => void;
}) {
  const eventType = EVENT_TYPES.find((t) => t.value === event.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className={cn("h-3 w-3 rounded-full", getEventColor(event).bg)} />
            <DialogTitle>{event.title}</DialogTitle>
          </div>
          <DialogDescription>
            {eventType?.label || "Event"} •{" "}
            {new Date(event.start_date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {event.cases && (
            <div>
              <Label>Case</Label>
              <p className="text-sm text-white">{event.cases.name}</p>
            </div>
          )}

          <div>
            <Label>Time</Label>
            <p className="text-sm text-white">
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
              <p className="text-sm text-white">{event.location}</p>
            </div>
          )}

          {event.video_link && (
            <div>
              <Label>Video Link</Label>
              <a
                href={event.video_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-amber-500 hover:underline"
              >
                <Video className="h-4 w-4" />
                Join Video Call
              </a>
            </div>
          )}

          {event.description && (
            <div>
              <Label>Description</Label>
              <p className="text-sm text-white">{event.description}</p>
            </div>
          )}

          {!event.isTask && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Day Detail Panel
function DayDetailPanel({
  open,
  onOpenChange,
  date,
  events,
  onEventClick,
  onNewEvent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  events: any[];
  onEventClick: (event: any) => void;
  onNewEvent: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {date.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-slate-400">No events scheduled for this day</p>
          ) : (
            events.map((event) => {
              const eventType = EVENT_TYPES.find((t) => t.value === event.type);
              return (
                <div
                  key={event.id}
                  className="cursor-pointer rounded-lg border border-slate-800 p-3 transition-colors hover:bg-slate-800"
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-1 h-2 w-2 rounded-full", getEventColor(event).bg)} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{event.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {eventType?.label}
                        </Badge>
                      </div>
                      {event.cases && (
                        <p className="mt-1 text-xs text-slate-400">{event.cases.name}</p>
                      )}
                      {!event.all_day && (
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(event.start_date).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {event.end_date &&
                            ` - ${new Date(event.end_date).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}`}
                        </p>
                      )}
                      {event.location && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button onClick={onNewEvent}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
