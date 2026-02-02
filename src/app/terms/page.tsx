import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl py-12 px-4">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/register">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Registration
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms and Conditions</CardTitle>
            <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none space-y-6 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using DiscoverEase, you accept and agree to be bound by the terms
                and provision of this agreement. If you do not agree to abide by the above, please
                do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">2. Use License</h2>
              <p>
                Permission is granted to temporarily access DiscoverEase for personal, commercial,
                or legal practice use only. This is the grant of a license, not a transfer of title,
                and under this license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>modify or copy the materials</li>
                <li>use the materials for any commercial purpose or for any public display</li>
                <li>attempt to reverse engineer any software contained on DiscoverEase</li>
                <li>remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">3. User Account</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and password
                and for restricting access to your computer. You agree to accept responsibility for
                all activities that occur under your account or password.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">4. Data Security</h2>
              <p>
                We take data security seriously and implement industry-standard measures to protect
                your information. However, you acknowledge that no method of transmission over the
                Internet or electronic storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">5. Legal Practice</h2>
              <p>
                DiscoverEase is a practice management tool and does not provide legal advice. You
                are responsible for ensuring compliance with all applicable laws, rules, and
                regulations in your jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">6. Subscription and Billing</h2>
              <p>
                Subscriptions are billed on a recurring basis. You may cancel your subscription at
                any time. Refunds are provided in accordance with our refund policy, which may be
                updated from time to time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">7. Limitation of Liability</h2>
              <p>
                In no event shall DiscoverEase or its suppliers be liable for any damages (including,
                without limitation, damages for loss of data or profit, or due to business
                interruption) arising out of the use or inability to use DiscoverEase.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">8. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Your continued use of
                DiscoverEase after any such changes constitutes your acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">9. Contact Information</h2>
              <p>
                If you have any questions about these Terms and Conditions, please contact us at
                legal@discoverease.com.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}










