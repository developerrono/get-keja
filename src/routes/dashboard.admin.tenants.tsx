import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminListUsers } from "@/lib/keja-api";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/dashboard/admin/tenants")({ component: TenantsPage });

function TenantsPage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminListUsers>>>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    adminListUsers().then((r) =>
      setRows(r.filter((u) => !u.roles || u.roles.length === 0 || u.roles.some((x) => x === "tenant")))
    );
  }, []);

  const filtered = rows.filter(
    (u) =>
      !q ||
      (u.full_name ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Tenants</h1>
      <Input placeholder="Search tenants by name or email..." value={q} onChange={(e) => setQ(e.target.value)} className="mt-4 max-w-sm" />
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((u) => (
          <div key={u.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="font-semibold">{u.full_name ?? "Tenant"}</div>
            <div className="text-xs text-muted-foreground">{u.email}</div>
            <div className="text-xs mt-2">
              <span className="px-2 py-1 rounded-full bg-muted">{u.status ?? "active"}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No tenants found.
          </div>
        )}
      </div>
    </div>
  );
}
