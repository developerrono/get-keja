import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  listTransactionsForLandlord,
  listPayoutsForLandlord,
  requestPayout,
  formatKsh,
  type DbTransaction,
  type DbPayout,
} from "@/lib/keja-api";
import { CheckCircle2, Clock, XCircle, Wallet, Building2, Receipt as ReceiptIcon, X, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/landlord/transactions")({
  head: () => ({ meta: [{ title: "Transactions — Landlord" }] }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<DbTransaction[]>([]);
  const [filter, setFilter] = useState<"all" | "success" | "pending" | "failed">("all");
  const [loading, setLoading] = useState(true);
  const [receiptTx, setReceiptTx] = useState<DbTransaction | null>(null);

  const [payouts, setPayouts] = useState<DbPayout[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [payoutOpen, setPayoutOpen] = useState(false);

  const loadPayouts = () => {
    if (!profile?.id) return;
    listPayoutsForLandlord(profile.id).then(({ rows: p, availableBalance: b }) => {
      setPayouts(p);
      setAvailableBalance(b);
    });
  };

  useEffect(() => {
    if (!profile?.id) return;
    listTransactionsForLandlord(profile.id)
      .then(setRows)
      .finally(() => setLoading(false));
    loadPayouts();
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

      <div className="grid sm:grid-cols-4 gap-4">
        <StatBlock label="Total collected" value={formatKsh(totals.grossCollected)} />
        <StatBlock label="You received" value={formatKsh(totals.netReceived)} highlight />
        <StatBlock label="Platform fee (1%)" value={formatKsh(totals.feesPaid)} />
        <div className="rounded-2xl border border-border p-5 bg-accent-soft flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs text-accent">
            <Wallet className="h-3.5 w-3.5" /> Available to withdraw
          </div>
          <p className="mt-2 font-display font-bold text-xl text-accent">{formatKsh(availableBalance)}</p>
          <button
            disabled={availableBalance < 1}
            onClick={() => setPayoutOpen(true)}
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold py-2 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" /> Request payout
          </button>
        </div>
      </div>

      {payouts.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-lg mb-3">Payout requests</h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Phone</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Requested</th>
                  <th className="text-left p-3">Reference</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3 font-semibold">{formatKsh(p.amount)}</td>
                    <td className="p-3">{p.phone}</td>
                    <td className="p-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                        p.status === "paid" ? "bg-accent-soft text-accent" : p.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                      }`}>{p.status}</span>
                    </td>
                    <td className="p-3 text-muted-foreground">{format(new Date(p.requested_at), "d MMM, HH:mm")}</td>
                    <td className="p-3 text-muted-foreground">{p.mpesa_reference ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
                    <th className="text-right p-3">Receipt</th>
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
                      <td className="p-3 text-right">
                        {tx.status === "success" ? (
                          <button
                            onClick={() => setReceiptTx(tx)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            <ReceiptIcon className="h-3.5 w-3.5" />
                            View
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}

      {receiptTx && <ReceiptModal transaction={receiptTx} onClose={() => setReceiptTx(null)} />}

      {payoutOpen && (
        <PayoutModal
          availableBalance={availableBalance}
          onClose={() => setPayoutOpen(false)}
          onRequested={() => {
            setPayoutOpen(false);
            loadPayouts();
          }}
          landlordId={profile?.id ?? ""}
        />
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

/**
 * Receipt generator: matches the pattern already built for the tenant rent
 * page — a modal with a "Download / Print" button that opens a formatted
 * receipt in a new window and triggers the browser's native print dialog
 * (no extra PDF dependency required).
 */
function ReceiptModal({ transaction, onClose }: { transaction: DbTransaction; onClose: () => void }) {
  const receiptNo = `GK-${String(transaction.id).slice(0, 8).toUpperCase()}`;
  const paidOn = format(new Date(transaction.created_at), "d MMM yyyy, HH:mm");

  const handleDownload = () => {
    const html = buildReceiptHtml({
      receiptNo,
      tenantName: transaction.tenant_name ?? "Tenant",
      propertyName: transaction.property_name ?? "—",
      amount: formatKsh(transaction.amount),
      landlordAmount: formatKsh(transaction.landlord_amount),
      paidOn,
      status: transaction.status,
    });

    const printWindow = window.open("", "_blank", "width=420,height=640");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="h-4 w-4" />
        </button>

        <div className="text-center mb-5">
          <ReceiptIcon className="h-6 w-6 mx-auto text-primary" />
          <h3 className="font-display font-bold text-lg mt-2">Payment receipt</h3>
          <p className="text-xs text-muted-foreground">{receiptNo}</p>
        </div>

        <dl className="space-y-3 text-sm">
          <Row label="Tenant" value={transaction.tenant_name ?? "—"} />
          <Row label="Property" value={transaction.property_name ?? "—"} />
          <Row label="Amount paid" value={formatKsh(transaction.amount)} />
          <Row label="You received (net of fee)" value={formatKsh(transaction.landlord_amount)} bold />
          <Row label="Status" value={transaction.status} />
          <Row label="Date" value={paidOn} />
        </dl>

        <button
          onClick={handleDownload}
          className="mt-6 w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:opacity-90 transition"
        >
          Download / Print receipt
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`capitalize ${bold ? "font-bold" : "font-medium"}`}>{value}</dd>
    </div>
  );
}

function buildReceiptHtml(data: {
  receiptNo: string;
  tenantName: string;
  propertyName: string;
  amount: string;
  landlordAmount: string;
  paidOn: string;
  status: string;
}) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Receipt ${data.receiptNo}</title>
    <style>
      body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 32px; color: #111; }
      .brand { font-weight: 800; font-size: 20px; margin-bottom: 4px; }
      .sub { color: #666; font-size: 12px; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      td { padding: 8px 0; font-size: 14px; border-bottom: 1px solid #eee; }
      td:first-child { color: #666; }
      td:last-child { text-align: right; font-weight: 600; text-transform: capitalize; }
      .total td { font-size: 16px; font-weight: 800; border-bottom: none; padding-top: 14px; }
      .footer { margin-top: 32px; font-size: 11px; color: #999; text-align: center; }
    </style>
  </head>
  <body>
    <div class="brand">GetKeja</div>
    <div class="sub">Receipt ${data.receiptNo}</div>
    <table>
      <tr><td>Tenant</td><td>${escapeHtml(data.tenantName)}</td></tr>
      <tr><td>Property</td><td>${escapeHtml(data.propertyName)}</td></tr>
      <tr><td>Status</td><td>${escapeHtml(data.status)}</td></tr>
      <tr><td>Date</td><td>${escapeHtml(data.paidOn)}</td></tr>
      <tr><td>Amount paid</td><td>${escapeHtml(data.amount)}</td></tr>
      <tr class="total"><td>You received</td><td>${escapeHtml(data.landlordAmount)}</td></tr>
    </table>
    <div class="footer">This is a system-generated receipt from GetKeja.</div>
  </body>
</html>`;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Request a payout of some or all of the available balance to an M-Pesa number. */
function PayoutModal({
  availableBalance,
  landlordId,
  onClose,
  onRequested,
}: {
  availableBalance: number;
  landlordId: string;
  onClose: () => void;
  onRequested: () => void;
}) {
  const [amount, setAmount] = useState(String(availableBalance));
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt < 1) return toast.error("Enter a valid amount.");
    if (amt > availableBalance) return toast.error("That's more than your available balance.");
    if (!phone.trim()) return toast.error("Enter the M-Pesa number to send the payout to.");
    setSubmitting(true);
    try {
      await requestPayout({ landlord_id: landlordId, amount: amt, phone });
      toast.success("Payout requested — you'll be notified once it's processed.");
      onRequested();
    } catch (err: any) {
      toast.error(err.message || "Could not request payout.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <h3 className="font-display font-bold text-lg">Request payout</h3>
        <p className="text-xs text-muted-foreground mt-1">Available: {formatKsh(availableBalance)}</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount (KSh)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1.5 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">M-Pesa phone number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XXXXXXXX"
              className="mt-1.5 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
            />
          </div>
        </div>

        <button
          onClick={submit}
          disabled={submitting}
          className="mt-6 w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {submitting ? "Requesting…" : "Request payout"}
        </button>
      </div>
    </div>
  );
}