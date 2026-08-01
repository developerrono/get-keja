import { useEffect, useMemo, useState } from "react";
import { adminListTransactions, formatKsh, type DbTransaction } from "@/lib/keja-api";
import { Landmark } from "lucide-react";

/**
 * Drop this into your admin dashboard/stats page. Shows the platform's 1%
 * take across every successful M-Pesa transaction, system-wide.
 */
export function AdminFeesCard() {
  const [rows, setRows] = useState<DbTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminListTransactions().then(setRows).finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => {
    const successful = rows.filter((r) => r.status === "success");
    return {
      totalFees: successful.reduce((s, r) => s + Number(r.admin_fee), 0),
      totalVolume: successful.reduce((s, r) => s + Number(r.amount), 0),
      count: successful.length,
    };
  }, [rows]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-1">
        <Landmark className="h-5 w-5 text-accent" />
        <h3 className="font-display font-bold text-lg">Platform revenue</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">1% fee collected on every successful rent payment.</p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total fees earned</p>
            <p className="font-display font-bold text-xl">{formatKsh(totals.totalFees)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total volume processed</p>
            <p className="font-display font-bold text-xl">{formatKsh(totals.totalVolume)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Successful payments</p>
            <p className="font-display font-bold text-xl">{totals.count}</p>
          </div>
        </div>
      )}
    </div>
  );
}
