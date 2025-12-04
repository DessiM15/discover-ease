"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resetPassword } from "@/lib/auth/actions";
import { Loader2, CheckCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await resetPassword(email);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
      }
    } catch (error: any) {
      setError(error.message || "An error occurred");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <CardTitle>Check your email</CardTitle>
          </div>
          <CardDescription>We've sent you a password reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 mb-4">
            If an account exists with {email}, you will receive a password reset link.
            Please check your inbox and follow the instructions to reset your password.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>Enter your email to receive a reset link</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleReset} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Remember your password?{" "}
          <Link href="/login" className="text-amber-500 hover:underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

