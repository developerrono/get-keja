import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { tenants, landlordProperties } from "@/lib/landlord-data";
import { formatKsh } from "@/lib/properties";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Mail, Phone, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/dashboard/landlord/tenants")({
  head: () => ({ meta: [{ title: "Tenants — Landlord" }] }),
  component: TenantsPage,
});

function TenantsPage() {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      tenants.filter(
        (t) =>
          t.name.toLowerCase().includes(q.toLowerCase()) ||
          t.email.toLowerCase().includes(q.toLowerCase()) ||
          t.phone.includes(q),
      ),
    [q],
  );

  const propMap = Object.fromEntries(landlordProperties.map((p) => [p.id, p.name]));

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Tenants</h1>
          <p className="text-sm text-muted-foreground mt-1">Active tenants across your properties.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tenants…" className="pl-9" />
        </div>
      </header>

      <section className="mt-6 rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Tenant</th>
                <th className="text-left px-6 py-3 font-semibold">Property / Unit</th>
                <th className="text-left px-6 py-3 font-semibold">Since</th>
                <th className="text-left px-6 py-3 font-semibold">Balance</th>
                <th className="text-right px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid place-items-center h-10 w-10 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                        {t.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{t.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{t.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{propMap[t.propertyId]}</div>
                    <div className="text-xs text-muted-foreground">Unit {t.unitNumber}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{t.since}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.balance > 0 ? "bg-destructive/10 text-destructive" : "bg-accent-soft text-accent"}`}>
                      {t.balance > 0 ? `Owes ${formatKsh(t.balance)}` : "Cleared"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Message"><MessageSquare className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Call"><Phone className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Email"><Mail className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">No tenants found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
