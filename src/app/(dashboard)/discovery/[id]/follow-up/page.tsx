"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { generateFollowUpEmail, getDiscoveryTypeLabel } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { useDiscoveryRequest } from "@/hooks/use-discovery";

export default function FollowUpEmailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("");
  
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);
  
  const { data: request } = useDiscoveryRequest(id);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (request) {
      const party = { name: (request as any).toPartyName || (request as any).to_party_name || "Counsel", email: "counsel@example.com" };
      setTo(party.email);
      setSubject(`Follow-up: ${getDiscoveryTypeLabel((request as any).type)} - ${request.title}`);
      setBody(generateFollowUpEmail(request, party));
    }
  }, [request]);

  const handleSend = async () => {
    setSending(true);
    try {
      // TODO: Integrate with SendGrid
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Follow-up email sent successfully");
      // Navigate back
      window.history.back();
    } catch (error) {
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!request) return;
    try {
      const response = await fetch("/api/discovery/draft-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemText: `Generate a professional follow-up email for a ${getDiscoveryTypeLabel((request as any).type)} that is ${(request as any).status === "overdue" ? "overdue" : "due soon"}.`,
          requestType: "email",
        }),
      });
      if (!response.ok) throw new Error("Failed to generate");
      const { draftResponse } = await response.json();
      setBody(draftResponse);
      toast.success("AI-generated email created");
    } catch (error) {
      toast.error("Failed to generate email");
    }
  };

  if (!request) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/discovery/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Send Follow-Up Email</h1>
          <p className="mt-1 text-muted-foreground">Send a reminder email about this discovery request</p>
        </div>
      </div>

      <div className="max-w-2xl space-y-4">
        <div>
          <Label>To</Label>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="email@example.com"
            className="mt-1 bg-card/50 border-border"
          />
        </div>

        <div>
          <Label>Subject</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 bg-card/50 border-border"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Body</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateAI}
              className="text-purple-400 hover:text-purple-300"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate with AI
            </Button>
          </div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[200px] bg-card/50 border-border"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href={`/discovery/${id}`}>Cancel</Link>
          </Button>
          <Button onClick={handleSend} disabled={sending || !to || !body}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

