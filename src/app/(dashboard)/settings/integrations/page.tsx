"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Mail,
  CreditCard,
  FileText,
  Cloud,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Building2,
  User,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface IntegrationStatus {
  connected: boolean;
  lastSync?: string;
  email?: string;
}

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  level: "firm" | "both";
  comingSoon?: boolean;
  features?: string[];
}

// Firm-level integrations
const firmIntegrations: IntegrationConfig[] = [
  {
    id: "quickbooks",
    name: "QuickBooks",
    description: "Sync invoices and financial data with QuickBooks Online",
    icon: FileText,
    level: "firm",
    features: ["Invoice sync", "Payment recording", "Customer management"],
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Payment processing and subscription billing",
    icon: CreditCard,
    level: "firm",
    features: ["Accept payments", "Subscription management", "Invoice payments"],
  },
];

// Email & Calendar integrations (available at both firm and user level)
const emailCalendarIntegrations: IntegrationConfig[] = [
  {
    id: "microsoft",
    name: "Microsoft 365",
    description: "Connect Outlook email and calendar for the firm",
    icon: Mail,
    level: "both",
    features: ["Email sync", "Calendar events", "Two-way sync"],
  },
  {
    id: "google",
    name: "Google Workspace",
    description: "Connect Gmail and Google Calendar for the firm",
    icon: Calendar,
    level: "both",
    features: ["Gmail access", "Calendar sync", "Two-way sync"],
  },
];

// Coming soon paid integrations
const comingSoonIntegrations: IntegrationConfig[] = [
  {
    id: "nylas",
    name: "Nylas",
    description: "Universal email API - connect 250+ providers with one integration",
    icon: Sparkles,
    level: "firm",
    comingSoon: true,
    features: ["Yahoo Mail", "iCloud", "IMAP/SMTP", "250+ providers"],
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Cloud document storage and sync",
    icon: Cloud,
    level: "firm",
    comingSoon: true,
    features: ["Document storage", "Auto-sync", "Version history"],
  },
];

export default function IntegrationsSettingsPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, IntegrationStatus>>({});

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success) {
      toast.success(`Successfully connected to ${success}!`);
      fetchStatus();
      window.history.replaceState({}, "", "/settings/integrations");
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        missing_params: "Missing required parameters from OAuth provider",
        callback_failed: "Failed to complete connection. Please try again.",
        access_denied: "Access was denied. Please approve the permissions.",
        invalid_state: "Security validation failed. Please try again.",
      };
      toast.error(errorMessages[error] || `Connection failed: ${error}`);
      window.history.replaceState({}, "", "/settings/integrations");
    }
  }, [searchParams]);

  const fetchStatus = async () => {
    try {
      setStatusLoading(true);
      const response = await fetch("/api/integrations/status");
      if (response.ok) {
        const data = await response.json();
        setIntegrationStatus(data.status || {});
      }
    } catch (error) {
      console.error("Failed to fetch integration status:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleConnect = async (id: string, type: "firm" | "user" = "firm") => {
    try {
      setLoading(id);

      const response = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: id, type }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start connection");
      }

      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      console.error(`Failed to connect ${id}:`, error);
      toast.error(error instanceof Error ? error.message : "Failed to start connection");
      setLoading(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    try {
      setLoading(id);

      const response = await fetch("/api/integrations/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to disconnect");
      }

      toast.success("Integration disconnected");
      fetchStatus();
    } catch (error) {
      console.error(`Failed to disconnect ${id}:`, error);
      toast.error(error instanceof Error ? error.message : "Failed to disconnect");
    } finally {
      setLoading(null);
    }
  };

  const handleManage = (id: string) => {
    switch (id) {
      case "stripe":
        window.open("https://dashboard.stripe.com", "_blank");
        break;
      case "quickbooks":
        window.open("https://app.qbo.intuit.com", "_blank");
        break;
      default:
        toast.info("Settings for this integration coming soon");
    }
  };

  const getStatus = (id: string) => integrationStatus[id]?.connected || false;

  const renderIntegrationCard = (integration: IntegrationConfig) => {
    const Icon = integration.icon;
    const isConnected = getStatus(integration.id);
    const isLoading = loading === integration.id;
    const status = integrationStatus[integration.id];

    return (
      <Card key={integration.id} className={isConnected ? "border-green-500/20" : integration.comingSoon ? "opacity-75" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${isConnected ? "bg-green-500/10" : integration.comingSoon ? "bg-muted" : "bg-amber-500/10"}`}>
                <Icon className={`h-5 w-5 ${isConnected ? "text-green-500" : integration.comingSoon ? "text-muted-foreground" : "text-amber-500"}`} />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {integration.name}
                  {isConnected && <CheckCircle className="h-4 w-4 text-green-500" />}
                </CardTitle>
                <CardDescription>{integration.description}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {integration.features && (
            <div className="mb-3 flex flex-wrap gap-1">
              {integration.features.map((feature) => (
                <Badge key={feature} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Badge
                variant={isConnected ? "success" : integration.comingSoon ? "outline" : "secondary"}
              >
                {isConnected ? "Connected" : integration.comingSoon ? "Coming Soon" : "Not Connected"}
              </Badge>
              {status?.email && (
                <p className="text-xs text-muted-foreground">{status.email}</p>
              )}
              {status?.lastSync && (
                <p className="text-xs text-muted-foreground">
                  Last synced: {new Date(status.lastSync).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {isConnected ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleManage(integration.id)}>
                    Manage
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect(integration.id)}
                    disabled={isLoading}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect"}
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleConnect(integration.id, "firm")}
                  disabled={isLoading || integration.comingSoon || statusLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : integration.comingSoon ? (
                    "Coming Soon"
                  ) : (
                    "Connect"
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Integrations</h1>
          <p className="mt-1 text-muted-foreground">
            Manage firm-wide connections to external services
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStatus} disabled={statusLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${statusLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* User Integration Notice */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Personal Email & Calendar</p>
              <p className="text-sm text-muted-foreground">
                Individual users can connect their personal Microsoft or Google accounts in{" "}
                <Link href="/settings/account" className="text-primary hover:underline">
                  Account Settings
                </Link>
                . This allows each team member to sync their own calendars and view emails.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Firm Email & Calendar */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Firm Email & Calendar</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Connect shared mailboxes and calendars for firm-wide access
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {emailCalendarIntegrations.map(renderIntegrationCard)}
        </div>
      </div>

      {/* Accounting & Billing */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Accounting & Billing</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {firmIntegrations.map(renderIntegrationCard)}
        </div>
      </div>

      {/* Coming Soon */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Coming Soon</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Additional integrations we&apos;re working on
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {comingSoonIntegrations.map(renderIntegrationCard)}
        </div>
      </div>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Integration Setup Requirements
          </CardTitle>
          <CardDescription>
            Environment variables required for each integration (configured by administrator)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <h4 className="font-medium text-foreground">Microsoft 365</h4>
              <p className="text-muted-foreground">
                <code className="bg-muted px-1 py-0.5 rounded text-xs">MICROSOFT_CLIENT_ID</code>,{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">MICROSOFT_CLIENT_SECRET</code>
              </p>
              <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                Azure Portal <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Google Workspace</h4>
              <p className="text-muted-foreground">
                <code className="bg-muted px-1 py-0.5 rounded text-xs">GOOGLE_CLIENT_ID</code>,{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">GOOGLE_CLIENT_SECRET</code>
              </p>
              <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                Google Cloud Console <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div>
              <h4 className="font-medium text-foreground">QuickBooks</h4>
              <p className="text-muted-foreground">
                <code className="bg-muted px-1 py-0.5 rounded text-xs">QUICKBOOKS_CLIENT_ID</code>,{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">QUICKBOOKS_CLIENT_SECRET</code>
              </p>
              <a href="https://developer.intuit.com" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                Intuit Developer <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Stripe</h4>
              <p className="text-muted-foreground">
                <code className="bg-muted px-1 py-0.5 rounded text-xs">STRIPE_SECRET_KEY</code>,{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>
              </p>
              <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                Stripe Dashboard <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
