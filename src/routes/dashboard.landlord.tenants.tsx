import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  listTenancies, createTenancy, updateTenancy,
  fetchProperties, fetchPropertyById,
  formatKsh, type DbTenancy, type DbProperty, type DbUnit,
} from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Mail, Phone, Plus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/landlord/tenants")({
  head: () => ({ meta: [{ title: "Tenants — Landlord" }] }),
  component: TenantsPage,
});

function TenantsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<DbTenancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    if (!user) return;
    setLoading(true);
    listTenancies(user.id)
      .then(setItems)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load tenants."))
      .finally(() => setLoading(false));
  };
  useEffect(load, [user]);

  const filtered = useMemo(
    () =>
      items.filter(
        (t) =>
          t.tenant_name.toLowerCase().includes(q.toLowerCase()) ||
          t.tenant_email.toLowerCase().includes(q.toLowerCase()) ||
          (t.tenant_phone ?? "").includes(q),
      ),
    [items, q],
  );

  const endTenancy = async (id: string) => {
    if (!window.confirm("End this tenancy? The unit will be marked vacant again.")) return;
    setBusyId(id);
    try {
      await updateTenancy(id, { status: "ended" });
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, status: "ended" } : t)));
      toast.success("Tenancy ended");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to end tenancy.");
    } finally {
      setBusyId(null);
    }
  };

  const saveBalance = async (id: string, balance: number) => {
    setBusyId(id);
    try {
      await updateTenancy(id, { balance });
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, balance } : t)));
      toast.success("Balance updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update balance.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Tenants</h1>
          <p className="text-sm text-muted-foreground mt-1">Active tenants across your properties.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tenants…" className="pl-9" />
          </div>
          <Button className="rounded-full gap-2 shrink-0" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> Add tenant
          </Button>
        </div>
      </header>

      {showAdd && user && (
        <AddTenancyForm
          landlordId={user.id}
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); load(); }}
        />
      )}

      {loading ? (
        <div className="mt-10 grid place-items-center text-sm text-muted-foreground gap-2 py-16">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading tenants…
        </div>
      ) : (
        <section className="mt-6 rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold">Tenant</th>
                  <th className="text-left px-6 py-3 font-semibold">Property / Unit</th>
                  <th className="text-left px-6 py-3 font-semibold">Since</th>
                  <th className="text-left px-6 py-3 font-semibold">Rent</th>
                  <th className="text-left px-6 py-3 font-semibold">Balance</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                  <th className="text-right px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => (
                  <TenancyRow key={t.id} t={t} busy={busyId === t.id} onEnd={() => endTenancy(t.id)} onSaveBalance={(b) => saveBalance(t.id, b)} />
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">No tenants found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function TenancyRow({ t, busy, onEnd, onSaveBalance }: { t: DbTenancy; busy: boolean; onEnd: () => void; onSaveBalance: (b: number) => void }) {
  const [balance, setBalance] = useState(String(t.balance));
  const dirty = Number(balance) !== t.balance;

  return (
    <tr className="hover:bg-muted/50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center h-10 w-10 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
            {t.tenant_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="font-semibold truncate">{t.tenant_name}</div>
            <div className="text-xs text-muted-foreground truncate">{t.tenant_email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="font-medium">{t.property_name}</div>
        {t.unit_label && <div className="text-xs text-muted-foreground">Unit {t.unit_label}</div>}
      </td>
      <td className="px-6 py-4 text-muted-foreground">{new Date(t.since_date).toLocaleDateString()}</td>
      <td className="px-6 py-4">{formatKsh(t.monthly_rent)}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="h-8 w-24 text-xs"
            disabled={t.status === "ended"}
          />
          {dirty && t.status === "active" && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => onSaveBalance(Number(balance))}>Save</Button>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`text-[11px] font-bold px-2 py-1 rounded-full capitalize ${t.status === "active" ? "bg-accent-soft text-accent" : "bg-muted text-muted-foreground"}`}>
          {t.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" title="Call" asChild>
            <a href={`tel:${t.tenant_phone ?? ""}`}><Phone className="h-4 w-4" /></a>
          </Button>
          <Button variant="ghost" size="icon" title="Email" asChild>
            <a href={`mailto:${t.tenant_email}`}><Mail className="h-4 w-4" /></a>
          </Button>
          {t.status === "active" && (
            <Button variant="ghost" size="sm" className="text-destructive" disabled={busy} onClick={onEnd}>
              End tenancy
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function AddTenancyForm({ landlordId, onClose, onCreated }: { landlordId: string; onClose: () => void; onCreated: () => void }) {
  const [properties, setProperties] = useState<DbProperty[]>([]);
  const [propertyId, setPropertyId] = useState<string>("");
  const [units, setUnits] = useState<DbUnit[]>([]);
  const [unitId, setUnitId] = useState<string>("none");
  const [tenantEmail, setTenantEmail] = useState("");
  const [sinceDate, setSinceDate] = useState("");
  const [rent, setRent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProperties({ landlord_id: landlordId, status: "all", limit: 100 }).then((r) => setProperties(r.rows));
  }, [landlordId]);

  useEffect(() => {
    if (!propertyId) { setUnits([]); return; }
    fetchPropertyById(propertyId).then(({ units: u, property }) => {
      setUnits(u);
      setRent(String(property.monthly_rent ?? ""));
    });
  }, [propertyId]);

  useEffect(() => {
    const u = units.find((x) => x.id === unitId);
    if (u?.monthly_rent) setRent(String(u.monthly_rent));
  }, [unitId, units]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !tenantEmail || !sinceDate || !rent) {
      toast.error("Fill in property, tenant email, since date, and rent.");
      return;
    }
    setSubmitting(true);
    try {
      await createTenancy({
        property_id: propertyId,
        unit_id: unitId !== "none" ? unitId : null,
        tenant_email: tenantEmail,
        landlord_id: landlordId,
        since_date: sinceDate,
        monthly_rent: Number(rent),
      });
      toast.success("Tenant added");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add tenant.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold">Add a tenant</h2>
        <Button type="button" variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        The tenant needs an existing GetKeja account — enter the email they signed up with.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label className="text-xs">Property</Label>
          <Select value={propertyId} onValueChange={setPropertyId}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select a property" /></SelectTrigger>
            <SelectContent>
              {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Unit (optional)</Label>
          <Select value={unitId} onValueChange={setUnitId} disabled={!propertyId}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="No specific unit" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific unit</SelectItem>
              {units.map((u) => <SelectItem key={u.id} value={u.id}>Unit {u.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Tenant email</Label>
          <Input type="email" value={tenantEmail} onChange={(e) => setTenantEmail(e.target.value)} placeholder="tenant@example.com" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Monthly rent</Label>
          <Input type="number" value={rent} onChange={(e) => setRent(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Tenancy start date</Label>
          <Input type="date" value={sinceDate} onChange={(e) => setSinceDate(e.target.value)} className="mt-1" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>{submitting ? "Adding…" : "Add tenant"}</Button>
      </div>
    </form>
  );
}
