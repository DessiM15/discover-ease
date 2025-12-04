import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FileSearch, FileText, FileCheck, FileQuestion, Calendar, type LucideIcon } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Discovery utility functions
export function getDiscoveryTypeIcon(type: string): LucideIcon {
  const icons: Record<string, LucideIcon> = {
    interrogatory: FileQuestion,
    rfp: FileText,
    rfa: FileCheck,
    subpoena: FileSearch,
    deposition_notice: Calendar,
  };
  return icons[type] || FileSearch;
}

export function getDiscoveryTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    interrogatory: "Interrogatory",
    rfp: "Request for Production",
    rfa: "Request for Admission",
    subpoena: "Subpoena",
    deposition_notice: "Deposition Notice",
    other: "Other",
  };
  return labels[type] || type;
}

export function calculateDaysRemaining(dueDate: string | Date | null): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function formatDaysRemaining(dueDate: string | Date | null): string {
  const days = calculateDaysRemaining(dueDate);
  if (days === null) return "No due date";
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `${days} days remaining`;
}

export function generateFollowUpEmail(request: any, party: any): string {
  const daysOverdue = request.dueDate ? Math.abs(calculateDaysRemaining(request.dueDate) || 0) : 0;
  
  return `Dear ${party?.firstName || party?.name || "Counsel"},

I am writing to follow up on the ${getDiscoveryTypeLabel(request.type)} served on ${request.servedDate ? new Date(request.servedDate).toLocaleDateString() : "recent date"}.

${daysOverdue > 0 ? `This request is now ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue. ` : ''}Please provide your response at your earliest convenience.

If you have any questions or need additional time, please contact me.

Best regards`;
}

export function formatBatesRange(start: string | number | null, end: string | number | null): string {
  if (!start || !end) return "N/A";
  return `${start}-${end}`;
}

