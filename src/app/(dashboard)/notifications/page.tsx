"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  Calendar,
  FileText,
  DollarSign,
  Users,
  Sparkles,
  Filter,
  X,
} from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const [filter, setFilter] = useState<string | null>(null);

  const notifications = [
    {
      id: "1",
      type: "deadline",
      title: "Discovery response due in 3 days",
      message: "Discovery request #12 for Smith v. Johnson is due on January 15, 2025",
      timestamp: "2 hours ago",
      read: false,
      priority: "high",
      link: "/discovery/1",
      icon: Calendar,
    },
    {
      id: "2",
      type: "document",
      title: "New document uploaded",
      message: "A new document was added to State v. Davis case",
      timestamp: "4 hours ago",
      read: false,
      priority: "medium",
      link: "/documents",
      icon: FileText,
    },
    {
      id: "3",
      type: "payment",
      title: "Payment received",
      message: "Payment of $5,000 received for Invoice #INV-2025-001",
      timestamp: "1 day ago",
      read: true,
      priority: "low",
      link: "/billing/payments",
      icon: DollarSign,
    },
    {
      id: "4",
      type: "ai",
      title: "New AI insight available",
      message: "AI-generated case summary ready for Smith v. Johnson",
      timestamp: "1 day ago",
      read: false,
      priority: "medium",
      link: "/insights",
      icon: Sparkles,
    },
    {
      id: "5",
      type: "team",
      title: "New team member added",
      message: "Jane Smith has been added to your firm",
      timestamp: "2 days ago",
      read: true,
      priority: "low",
      link: "/settings/team",
      icon: Users,
    },
    {
      id: "6",
      type: "deadline",
      title: "Court hearing reminder",
      message: "Court hearing for Estate of Williams scheduled for January 20, 2025",
      timestamp: "3 days ago",
      read: true,
      priority: "high",
      link: "/calendar",
      icon: Calendar,
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deadline":
        return Calendar;
      case "document":
        return FileText;
      case "payment":
        return DollarSign;
      case "ai":
        return Sparkles;
      case "team":
        return Users;
      default:
        return Info;
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      default:
        return "secondary";
    }
  };

  const filteredNotifications = filter
    ? notifications.filter((n) => n.type === filter)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    // TODO: Implement mark all as read
    console.log("Mark all as read");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Notifications</h1>
          <p className="mt-1 text-slate-400">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="deadline">Deadlines</TabsTrigger>
          <TabsTrigger value="document">Documents</TabsTrigger>
          <TabsTrigger value="payment">Payments</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const Icon = getTypeIcon(notification.type);
              return (
                <Card
                  key={notification.id}
                  className={`hover:border-amber-500/20 transition-colors ${
                    !notification.read ? "border-l-4 border-l-amber-500" : ""
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`rounded-lg p-2 ${
                          !notification.read
                            ? "bg-amber-500/10"
                            : "bg-slate-800/50"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            !notification.read ? "text-amber-500" : "text-slate-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3
                                className={`font-semibold ${
                                  !notification.read ? "text-white" : "text-slate-300"
                                }`}
                              >
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <Badge variant="default" className="text-xs">
                                  New
                                </Badge>
                              )}
                              <Badge variant={getPriorityVariant(notification.priority)} className="text-xs">
                                {notification.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400 mb-2">{notification.message}</p>
                            <p className="text-xs text-slate-500">{notification.timestamp}</p>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={notification.link}>
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-400">No notifications</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          {notifications.filter((n) => !n.read).length > 0 ? (
            notifications
              .filter((n) => !n.read)
              .map((notification) => {
                const Icon = getTypeIcon(notification.type);
                return (
                  <Card
                    key={notification.id}
                    className="hover:border-amber-500/20 transition-colors border-l-4 border-l-amber-500"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="rounded-lg bg-amber-500/10 p-2">
                          <Icon className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-white">{notification.title}</h3>
                                <Badge variant="default" className="text-xs">
                                  New
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-400 mb-2">{notification.message}</p>
                              <p className="text-xs text-slate-500">{notification.timestamp}</p>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={notification.link}>View</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-slate-400">All notifications read</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {["deadline", "document", "payment", "ai"].map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            {notifications.filter((n) => n.type === type).length > 0 ? (
              notifications
                .filter((n) => n.type === type)
                .map((notification) => {
                  const Icon = getTypeIcon(notification.type);
                  return (
                    <Card
                      key={notification.id}
                      className={`hover:border-amber-500/20 transition-colors ${
                        !notification.read ? "border-l-4 border-l-amber-500" : ""
                      }`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div
                            className={`rounded-lg p-2 ${
                              !notification.read
                                ? "bg-amber-500/10"
                                : "bg-slate-800/50"
                            }`}
                          >
                            <Icon
                              className={`h-5 w-5 ${
                                !notification.read ? "text-amber-500" : "text-slate-400"
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3
                                    className={`font-semibold ${
                                      !notification.read ? "text-white" : "text-slate-300"
                                    }`}
                                  >
                                    {notification.title}
                                  </h3>
                                  {!notification.read && (
                                    <Badge variant="default" className="text-xs">
                                      New
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-slate-400 mb-2">{notification.message}</p>
                                <p className="text-xs text-slate-500">{notification.timestamp}</p>
                              </div>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={notification.link}>View</Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                    <p className="text-slate-400">No {type} notifications</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

