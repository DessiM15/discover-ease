"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

export default function DataPrivacySettingsPage() {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleExportData = async () => {
    try {
      // TODO: Implement data export
      toast.info("Data export functionality coming soon");
    } catch (error: any) {
      toast.error(error.message || "Failed to export data");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // TODO: Implement account deletion
      toast.error("Account deletion is not yet implemented. Please contact support.");
      setIsDeleteOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data & Privacy</h1>
        <p className="mt-1 text-muted-foreground">Manage your data and privacy settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Download all your firm data as a ZIP file</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export all your cases, contacts, documents, invoices, and other data in a portable
              format.
            </p>
            <Button onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export Firm Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Retention</CardTitle>
          <CardDescription>Configure how long data is retained</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your data is retained indefinitely unless you request deletion. Closed cases are
            archived after 7 years.
          </p>
        </CardContent>
      </Card>

      <Card className="border-red-500/50">
        <CardHeader>
          <CardTitle className="text-red-400">Delete Account</CardTitle>
          <CardDescription>Permanently delete your account and all data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-4">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="flex-1">
                <p className="font-medium text-red-400">Warning: This action cannot be undone</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Deleting your account will permanently remove all your data, including cases,
                  contacts, documents, invoices, and all other information. This action cannot be
                  reversed.
                </p>
              </div>
            </div>
            <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you absolutely sure? This will permanently delete your account and all data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">
                Type <strong>DELETE</strong> to confirm
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                Delete Account
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}










