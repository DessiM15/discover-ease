import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users } from "lucide-react";
import Link from "next/link";

export default function ContactsPage() {
  const contacts = [
    { id: "1", name: "Jane Smith", type: "client", email: "jane@example.com", phone: "555-0100" },
    { id: "2", name: "John Johnson", type: "opposing_counsel", email: "john@law.com", phone: "555-0101" },
    { id: "3", name: "Williams Family", type: "client", email: "williams@example.com", phone: "555-0102" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Contacts</h1>
          <p className="mt-1 text-slate-400">Manage clients, opposing parties, and other contacts</p>
        </div>
        <Button asChild>
          <Link href="/contacts/new">
            <Plus className="mr-2 h-4 w-4" />
            New Contact
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search contacts..."
              className="pl-10 bg-slate-900/50 border-slate-800"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contacts.map((contact) => (
          <Card key={contact.id} className="hover:border-amber-500/20 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">{contact.name}</h3>
                    <Badge variant="outline">{contact.type.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-sm text-slate-400">{contact.email}</p>
                  <p className="text-sm text-slate-400">{contact.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

