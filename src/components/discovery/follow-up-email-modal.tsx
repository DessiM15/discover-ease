"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { generateFollowUpEmail, getDiscoveryTypeLabel } from "@/lib/utils";
import { toast } from "sonner";

interface FollowUpEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  party: any;
}

export function FollowUpEmailModal({
  open,
  onOpenChange,
  request,
  party,
}: FollowUpEmailModalProps) {
  const [to, setTo] = useState(party?.email || "");
  const [subject, setSubject] = useState(
    `Follow-up: ${getDiscoveryTypeLabel(request.type)} - ${request.title}`
  );
  const [body, setBody] = useState(generateFollowUpEmail(request, party));
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      // TODO: Integrate with SendGrid
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Follow-up email sent successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const handleGenerateAI = async () => {
    try {
      const response = await fetch("/api/discovery/draft-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemText: `Generate a professional follow-up email for a ${getDiscoveryTypeLabel(request.type)} that is ${request.status === "overdue" ? "overdue" : "due soon"}.`,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glass border-slate-800">
        <DialogHeader>
          <DialogTitle>Send Follow-Up Email</DialogTitle>
          <DialogDescription>
            Send a reminder email about this discovery request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label>To</Label>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="email@example.com"
              className="mt-1 bg-slate-900/50 border-slate-800"
            />
          </div>

          <div>
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 bg-slate-900/50 border-slate-800"
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
              className="min-h-[200px] bg-slate-900/50 border-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
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
      </DialogContent>
    </Dialog>
  );
}

