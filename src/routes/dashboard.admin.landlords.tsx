import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminListUsers, adminReactivateUser } from "@/lib/keja-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/landlords")({ component: LandlordsPage });

type Landlord = Awaited<ReturnType<typeof adminListUsers>>[number];

function LandlordCard({ u }: { u: Landlord }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="font-semibold flex items-center gap-1">
        {u.full_name ?? "Landlord"} {u.is_verified && <ShieldCheck className="h-4 w-4 text-accent" />}
      </div>
      <div className="text-xs text-muted-foreground">{u.email}</div>
      <div className="text-xs mt-2">{u.roles.join(", ")}</div>
    </div>
  );
}

function DeactivatedCard({ u, onReactivated }: { u: Landlord; onReactivated: () => void }) {
  const [reactivating, setReactivating] = useState(false);

  const reactivate = async () => {
    setReactivating(true);
    try {
      await adminReactivateUser(u.id);
      toast.success("Account reactivated.");
      onReactivated();
    } catch {
      toast.error("Couldn't reactivate this account.");
    } finally {
      setReactivating(false);
    }
  };

  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
      <div className="font-semibold flex items-center gap-1.5">
        <ShieldOff className="h-4 w-4 text-destructive" />
        {u.full_name ?? "Landlord"}
      </div>
      <div className="text-xs text-muted-foreground">{u.email}</div>
      {u.deactivated_at && (
        <div className="text-xs text-muted-foreground mt-2">
          Deactivated {new Date(u.deactivated_at).toLocaleDateString()}
        </div>
      )}
      {u.deactivation_reason && (
        <div className="text-xs mt-2 rounded-lg bg-card border border-border p-2.5">
          <span className="font-semibold">Reason: </span>
          {u.deactivation_reason}
        </div>
      )}
      <Button size="sm" variant="outline" onClick={reactivate} disabled={reactivating} className="mt-3">
        {reactivating ? "Reactivating…" : "Reactivate account"}
      </Button>
    </div>
  );
}

function LandlordsPage() {
  const [rows, setRows] = useState<Landlord[]>([]);
  const [q, setQ] = useState("");

  const load = () => {
    adminListUsers().then((r) =>
      setRows(r.filter((u) => u.roles.some((x) => x === "landlord" || x === "verified_landlord")))
    );
  };

  useEffect(load, []);

  const filtered = rows.filter(
    (u) =>
      !q ||
      (u.full_name ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(q.toLowerCase())
  );

  const deactivated = filtered.filter((u) => u.status === "deactivated");
  const active = filtered.filter((u) => u.status !== "deactivated");
  const verified = active.filter((u) => u.is_verified);
  const pending = active.filter((u) => !u.is_verified);

  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Landlords</h1>
      <Input
        placeholder="Search landlords by name or email..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mt-4 max-w-sm"
      />

      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <h2 className="font-display font-semibold">Verified ({verified.length})</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {verified.map((u) => <LandlordCard key={u.id} u={u} />)}
          {verified.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
              No verified landlords match your search.
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-display font-semibold">Pending verification ({pending.length})</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pending.map((u) => <LandlordCard key={u.id} u={u} />)}
          {pending.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
              No pending landlords match your search.
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center gap-2 mb-3">
          <ShieldOff className="h-4 w-4 text-destructive" />
          <h2 className="font-display font-semibold">Deactivated ({deactivated.length})</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deactivated.map((u) => <DeactivatedCard key={u.id} u={u} onReactivated={load} />)}
          {deactivated.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
              No deactivated landlords.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
