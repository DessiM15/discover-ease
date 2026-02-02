"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Application Error</CardTitle>
              </div>
              <CardDescription>
                A critical error occurred. Please see details below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="mb-2 font-semibold">Error Message:</p>
                <code className="block p-3 bg-muted rounded text-xs overflow-auto max-h-40">
                  {error.message || "Unknown error occurred"}
                </code>
                {error.digest && (
                  <p className="mt-2 text-xs">Error ID: {error.digest}</p>
                )}
                {error.stack && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs font-semibold mb-2">Stack Trace</summary>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-60">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={reset} variant="default">
                  Try again
                </Button>
                <Button onClick={() => window.location.href = "/login"} variant="outline">
                  Go to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}










