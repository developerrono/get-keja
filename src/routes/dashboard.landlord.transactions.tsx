import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { listTransactionsForLandlord, formatKsh, type DbTransaction } from "@/lib/keja-api";
import { CheckCircle2, Clock, XCircle, Wallet } from "lucide-react";
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

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Transactions</h1>
        <p className="text-sm text-muted-foreground mt-1">Rent payments received via M-Pesa, net of the platform fee.</p>
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
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Tenant</th>
                <th className="text-left p-3">Property</th>
                <th className="text-right p-3">Amount</th>
                <th className="text-right p-3">Fee (1%)</th>
                <th className="text-right p-3">You receive</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.id} className="border-t border-border">
                  <td className="p-3">{tx.tenant_name ?? "—"}</td>
                  <td className="p-3">{tx.property_name ?? "—"}</td>
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
