"use client";

import { FontComplianceChecker } from "@/components/documents/font-compliance-checker";

export default function CourtFilingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Court Filing Preparation</h1>
        <p className="mt-1 text-muted-foreground">
          Prepare and validate documents for court filing
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <FontComplianceChecker />
        </div>
      </div>
    </div>
  );
}
