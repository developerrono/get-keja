import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { adminListTransactions, formatKsh, type DbTransaction } from "@/lib/keja-api";
import { AdminFeesCard } from "@/components/dashboard/AdminFeesCard";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Clock, XCircle, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard/admin/transactions")({
  head: () => ({ meta: [{ title: "Transactions — Admin" }] }),
  component: AdminTransactionsPage,
});

function AdminTransactionsPage() {
  const [rows, setRows] = useState<DbTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "success" | "pending" | "failed">("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    adminListTransactions()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let arr = filter === "all" ? rows : rows.filter((r) => r.status === filter);
    if (q) {
      const needle = q.toLowerCase();
      arr = arr.filter(
        (r) =>
          (r.tenant_name ?? "").toLowerCase().includes(needle) ||
          (r.landlord_name ?? "").toLowerCase().includes(needle) ||
          (r.property_name ?? "").toLowerCase().includes(needle) ||
          (r.mpesa_receipt ?? "").toLowerCase().includes(needle),
      );
    }
    return arr;
  }, [rows, filter, q]);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Transactions</h1>
        <p className="text-sm text-muted-foreground mt-1">Every M-Pesa payment processed across the platform.</p>
      </header>

      <AdminFeesCard />

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="inline-flex rounded-full border border-border p-1 bg-card">
          {(["all", "success", "pending", "failed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 h-8 rounded-full text-xs capitalize font-medium ${
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tenant, landlord, property…" className="pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-24 text-sm text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading transactions…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No transactions found.
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Tenant</th>
                <th className="text-left p-3">Landlord</th>
                <th className="text-left p-3">Property</th>
                <th className="text-right p-3">Amount</th>
                <th className="text-right p-3">Platform fee</th>
                <th className="text-right p-3">Landlord received</th>
                <th className="text-left p-3">Receipt</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.id} className="border-t border-border">
                  <td className="p-3">{tx.tenant_name ?? "—"}</td>
                  <td className="p-3">{tx.landlord_name ?? "—"}</td>
                  <td className="p-3">{tx.property_name ?? "—"}</td>
                  <td className="p-3 text-right">{formatKsh(tx.amount)}</td>
                  <td className="p-3 text-right text-muted-foreground">{formatKsh(tx.admin_fee)}</td>
                  <td className="p-3 text-right font-semibold">{formatKsh(tx.landlord_amount)}</td>
                  <td className="p-3 text-xs text-muted-foreground">{tx.mpesa_receipt ?? "—"}</td>
                  <td className="p-3"><StatusBadge status={tx.status} /></td>
                  <td className="p-3 text-muted-foreground">{format(new Date(tx.created_at), "d MMM, HH:mm")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: DbTransaction["status"] }) {
  const map = {
    success: { icon: CheckCircle2, cls: "text-green-600" },
    pending: { icon: Clock, cls: "text-amber-500" },
    failed: { icon: XCircle, cls: "text-destructive" },
  } as const;
  const { icon: Icon, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold capitalize ${cls}`}>
      <Icon className="h-3.5 w-3.5" /> {status}
    </span>
  );
}
