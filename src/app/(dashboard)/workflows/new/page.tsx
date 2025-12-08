"use client";

import { useState } from "react";
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
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function NewWorkflowPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    trigger: "",
    action: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.trigger || !formData.action) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // TODO: Implement workflow creation
    toast.success("Workflow created successfully");
    router.push("/workflows");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/workflows">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create New Workflow</h1>
          <p className="mt-1 text-muted-foreground">
            Set up an automated workflow to streamline your practice
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div>
          <Label>Workflow Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Auto-remind before deadline"
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label>Trigger</Label>
          <Select
            value={formData.trigger}
            onValueChange={(value) => setFormData({ ...formData, trigger: value })}
            required
          >
            <SelectTrigger className="mt-1">
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
            value={formData.action}
            onValueChange={(value) => setFormData({ ...formData, action: value })}
            required
          >
            <SelectTrigger className="mt-1">
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
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what this workflow does..."
            className="mt-1"
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/workflows">Cancel</Link>
          </Button>
          <Button type="submit">Create Workflow</Button>
        </div>
      </form>
    </div>
  );
}

