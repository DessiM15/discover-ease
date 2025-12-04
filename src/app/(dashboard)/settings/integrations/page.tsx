"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, CreditCard, FileText, Cloud } from "lucide-react";

const integrations = [
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync events and deadlines with Google Calendar",
    icon: Calendar,
    status: "disconnected",
    action: "Connect",
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    description: "Sync with Outlook calendar and email",
    icon: Mail,
    status: "disconnected",
    action: "Connect",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Payment processing and billing",
    icon: CreditCard,
    status: "connected",
    action: "Manage",
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    description: "Sync invoices and financial data",
    icon: FileText,
    status: "coming_soon",
    action: "Coming Soon",
    disabled: true,
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Cloud storage integration",
    icon: Cloud,
    status: "coming_soon",
    action: "Coming Soon",
    disabled: true,
  },
];

export default function IntegrationsSettingsPage() {
  const handleConnect = (id: string) => {
    // TODO: Implement OAuth flow for each integration
    console.log(`Connecting ${id}...`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Integrations</h1>
        <p className="mt-1 text-slate-400">Connect with external services and tools</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-500/10 p-2">
                      <Icon className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <CardTitle className="text-white">{integration.name}</CardTitle>
                      <CardDescription>{integration.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      integration.status === "connected"
                        ? "success"
                        : integration.status === "coming_soon"
                          ? "outline"
                          : "secondary"
                    }
                  >
                    {integration.status === "connected"
                      ? "Connected"
                      : integration.status === "coming_soon"
                        ? "Coming Soon"
                        : "Not Connected"}
                  </Badge>
                  <Button
                    variant={integration.status === "connected" ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleConnect(integration.id)}
                    disabled={integration.disabled}
                  >
                    {integration.action}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

