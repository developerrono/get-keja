import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminListUsers } from "@/lib/keja-api";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/dashboard/admin/users")({ component: UsersPage });

function UsersPage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminListUsers>>>([]);
  const [q, setQ] = useState("");
  useEffect(() => { adminListUsers().then(setRows); }, []);
  const filtered = rows.filter((r) => !q || (r.full_name ?? "").toLowerCase().includes(q.toLowerCase()) || (r.email ?? "").toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Users</h1>
      <Input placeholder="Search users..." value={q} onChange={(e) => setQ(e.target.value)} className="mt-4 max-w-sm" />
      <div className="mt-6 rounded-2xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr className="[&_th]:p-3 [&_th]:text-left">
            <th>Name</th><th>Email</th><th>Roles</th><th>Status</th>
          </tr></thead>
          <tbody className="[&_td]:p-3 [&_tr]:border-t [&_tr]:border-border">
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name ?? "—"}</td>
                <td>{u.email}</td>
                <td>{(u.roles ?? []).join(", ") || "tenant"}</td>
                <td><span className="text-xs px-2 py-1 rounded-full bg-muted">{u.status ?? "active"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
