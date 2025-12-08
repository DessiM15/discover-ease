"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Sparkles, Play, Pause, Trash2 } from "lucide-react";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([
    {
      id: "1",
      name: "Auto-remind 3 days before deadline",
      trigger: "deadline_approaching",
      action: "send_email",
      status: "active",
      description: "Automatically send reminder emails 3 days before discovery deadlines",
    },
    {
      id: "2",
      name: "AI summarize uploaded documents",
      trigger: "document_uploaded",
      action: "analyze_with_ai",
      status: "active",
      description: "Generate AI summaries for newly uploaded case documents",
    },
    {
      id: "3",
      name: "Send overdue notice to opposing counsel",
      trigger: "overdue",
      action: "send_email",
      status: "paused",
      description: "Send automated follow-up emails when discovery requests become overdue",
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    trigger: "",
    action: "",
    description: "",
  });

  const handleCreateWorkflow = () => {
    if (!newWorkflow.name || !newWorkflow.trigger || !newWorkflow.action) return;
    
    const workflow = {
      id: Date.now().toString(),
      ...newWorkflow,
      status: "active",
    };
    setWorkflows([...workflows, workflow]);
    setNewWorkflow({ name: "", trigger: "", action: "", description: "" });
    setDialogOpen(false);
  };

  const toggleWorkflow = (id: string) => {
    setWorkflows(
      workflows.map((w) =>
        w.id === id ? { ...w, status: w.status === "active" ? "paused" : "active" } : w
      )
    );
  };

  const deleteWorkflow = (id: string) => {
    setWorkflows(workflows.filter((w) => w.id !== id));
  };

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      document_uploaded: "Document Uploaded",
      deadline_approaching: "Deadline Approaching",
      overdue: "Overdue",
      scheduled: "Scheduled",
    };
    return labels[trigger] || trigger;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      send_email: "Send Email",
      analyze_with_ai: "Analyze with AI",
      generate_report: "Generate Report",
      update_status: "Update Status",
    };
    return labels[action] || action;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Workflows</h1>
          <p className="mt-1 text-muted-foreground">Automate tasks with AI-powered workflows</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-border">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
              <DialogDescription>
                Set up an automated workflow to streamline your practice
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Workflow Name</Label>
                <Input
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  placeholder="e.g., Auto-remind before deadline"
                  className="mt-1 bg-background border-border"
                />
              </div>
              <div>
                <Label>Trigger</Label>
                <Select
                  value={newWorkflow.trigger}
                  onValueChange={(value) => setNewWorkflow({ ...newWorkflow, trigger: value })}
                >
                  <SelectTrigger className="mt-1 bg-background border-border">
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document_uploaded">Document Uploaded</SelectItem>
                    <SelectItem value="deadline_approaching">Deadline Approaching</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Action</Label>
                <Select
                  value={newWorkflow.action}
                  onValueChange={(value) => setNewWorkflow({ ...newWorkflow, action: value })}
                >
                  <SelectTrigger className="mt-1 bg-background border-border">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="send_email">Send Email</SelectItem>
                    <SelectItem value="analyze_with_ai">Analyze with AI</SelectItem>
                    <SelectItem value="generate_report">Generate Report</SelectItem>
                    <SelectItem value="update_status">Update Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  placeholder="Describe what this workflow does..."
                  className="mt-1 bg-background border-border"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkflow}>Create Workflow</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="hover:border-amber-500/20 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  </div>
                  <Badge variant={workflow.status === "active" ? "default" : "secondary"}>
                    {workflow.status === "active" ? "Active" : "Paused"}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleWorkflow(workflow.id)}
                  >
                    {workflow.status === "active" ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteWorkflow(workflow.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Trigger:</span>{" "}
                  <span className="text-foreground">{getTriggerLabel(workflow.trigger)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Action:</span>{" "}
                  <span className="text-foreground">{getActionLabel(workflow.action)}</span>
                </div>
                {workflow.description && (
                  <p className="text-muted-foreground mt-3">{workflow.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

