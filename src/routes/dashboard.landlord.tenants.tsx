import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { listTenancies, updateTenancy, formatKsh, type DbTenancy } from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard/landlord/tenants")({
  head: () => ({ meta: [{ title: "Tenants — Landlord" }] }),
  component: TenantsPage,
});

function TenantsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<DbTenancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = () => { if (user) listTenancies(user.id).then((d) => { setItems(d); setLoading(false); }); };
  useEffect(load, [user]);

  const filtered = useMemo(
    () =>
      items.filter(
        (t) =>
          !q ||
          t.tenant_name?.toLowerCase().includes(q.toLowerCase()) ||
          t.tenant_email?.toLowerCase().includes(q.toLowerCase()) ||
          (t.tenant_phone ?? "").includes(q),
      ),
    [items, q],
  );

  const markCleared = async (id: string) => {
    try { await updateTenancy(id, { balance: 0 }); toast.success("Marked as cleared"); load(); }
    catch { toast.error("Could not update."); }
  };

  const endTenancy = async (id: string) => {
    try { await updateTenancy(id, { status: "ended" }); toast.success("Tenancy ended"); load(); }
    catch { toast.error("Could not update."); }
  };

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
        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading...</div>
        ) : (
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
                      <div className="font-semibold truncate">{t.tenant_name}</div>
                      <div className="text-xs text-muted-foreground truncate">{t.tenant_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{t.property_name}</div>
                      {t.unit_label && <div className="text-xs text-muted-foreground">Unit {t.unit_label}</div>}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{format(new Date(t.since_date), "d MMM yyyy")}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${Number(t.balance) > 0 ? "bg-destructive/10 text-destructive" : "bg-accent-soft text-accent"}`}>
                        {Number(t.balance) > 0 ? `Owes ${formatKsh(t.balance)}` : "Cleared"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        {t.tenant_phone && <Button variant="ghost" size="icon" title="Call" asChild><a href={`tel:${t.tenant_phone}`}><Phone className="h-4 w-4" /></a></Button>}
                        <Button variant="ghost" size="icon" title="Email" asChild><a href={`mailto:${t.tenant_email}`}><Mail className="h-4 w-4" /></a></Button>
                        {Number(t.balance) > 0 && (
                          <Button variant="outline" size="sm" onClick={() => markCleared(t.id)}>Mark cleared</Button>
                        )}
                        {t.status === "active" && (
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => endTenancy(t.id)}>End</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">No tenants yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
