import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { listTransactionsForLandlord, formatKsh, type DbTransaction } from "@/lib/keja-api";
import { CheckCircle2, Clock, XCircle, Wallet, Building2 } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard/landlord/transactions")({
  head: () => ({ meta: [{ title: "Transactions — Landlord" }] }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<DbTransaction[]>([]);
  const [filter, setFilter] = useState<"all" | "success" | "pending" | "failed">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    listTransactionsForLandlord(profile.id)
      .then(setRows)
      .finally(() => setLoading(false));
  }, [profile?.id]);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  const totals = useMemo(() => {
    const successful = rows.filter((r) => r.status === "success");
    return {
      grossCollected: successful.reduce((s, r) => s + Number(r.amount), 0),
      netReceived: successful.reduce((s, r) => s + Number(r.landlord_amount), 0),
      feesPaid: successful.reduce((s, r) => s + Number(r.admin_fee), 0),
      pendingCount: rows.filter((r) => r.status === "pending").length,
    };
  }, [rows]);

  // Group transactions by property — a full bill history per property, most
  // recently active property first.
  const groups = useMemo(() => {
    const byProperty = new Map<string, DbTransaction[]>();
    for (const tx of filtered) {
      const key = tx.property_name ?? "Unassigned";
      if (!byProperty.has(key)) byProperty.set(key, []);
      byProperty.get(key)!.push(tx);
    }
    return Array.from(byProperty.entries())
      .map(([property, txs]) => {
        const successful = txs.filter((t) => t.status === "success");
        return {
          property,
          txs: [...txs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
          netReceived: successful.reduce((s, t) => s + Number(t.landlord_amount), 0),
          grossCollected: successful.reduce((s, t) => s + Number(t.amount), 0),
        };
      })
      .sort((a, b) => {
        const aLatest = a.txs[0] ? new Date(a.txs[0].created_at).getTime() : 0;
        const bLatest = b.txs[0] ? new Date(b.txs[0].created_at).getTime() : 0;
        return bLatest - aLatest;
      });
  }, [filtered]);

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Transactions</h1>
        <p className="text-sm text-muted-foreground mt-1">Rent payments received via M-Pesa, net of the platform fee — grouped by property.</p>
      </header>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatBlock label="Total collected" value={formatKsh(totals.grossCollected)} />
        <StatBlock label="You received" value={formatKsh(totals.netReceived)} highlight />
        <StatBlock label="Platform fee (1%)" value={formatKsh(totals.feesPaid)} />
      </div>

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

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No transactions yet.
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.property} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border bg-surface flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-display font-bold truncate">{g.property}</span>
                  <span className="text-xs text-muted-foreground shrink-0">({g.txs.length})</span>
                </div>
                <div className="text-xs text-muted-foreground shrink-0">
                  Collected {formatKsh(g.grossCollected)} · You received <span className="font-semibold text-foreground">{formatKsh(g.netReceived)}</span>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-surface/60 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left p-3">Tenant</th>
                    <th className="text-right p-3">Amount</th>
                    <th className="text-right p-3">Fee (1%)</th>
                    <th className="text-right p-3">You receive</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {g.txs.map((tx) => (
                    <tr key={tx.id} className="border-t border-border">
                      <td className="p-3">{tx.tenant_name ?? "—"}</td>
                      <td className="p-3 text-right">{formatKsh(tx.amount)}</td>
                      <td className="p-3 text-right text-muted-foreground">{formatKsh(tx.admin_fee)}</td>
                      <td className="p-3 text-right font-semibold">{formatKsh(tx.landlord_amount)}</td>
                      <td className="p-3">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="p-3 text-muted-foreground">{format(new Date(tx.created_at), "d MMM, HH:mm")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border border-border p-5 ${highlight ? "bg-primary-soft" : "bg-card"}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Wallet className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-2 font-display font-bold text-xl">{value}</p>
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
