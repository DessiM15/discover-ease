import { Scale } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500">
                <Scale className="h-7 w-7 text-slate-950" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white">DiscoverEase</h1>
            <p className="mt-2 text-slate-400">Legal Practice Management</p>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}

