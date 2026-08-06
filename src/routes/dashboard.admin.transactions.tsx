import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { adminListTransactions, formatKsh, type DbTransaction } from "@/lib/keja-api";
import { AdminFeesCard } from "@/components/dashboard/AdminFeesCard";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Clock, XCircle, Search, Loader2, Receipt as ReceiptIcon, X } from "lucide-react";
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
  const [receiptTx, setReceiptTx] = useState<DbTransaction | null>(null);

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
                <th className="text-right p-3">Slip</th>
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
        </div>
      )}

      {receiptTx && <ReceiptModal transaction={receiptTx} onClose={() => setReceiptTx(null)} />}
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
 * Same self-contained receipt pattern used on the tenant and landlord pages —
 * "Download / Print" opens a formatted receipt in a new window and triggers
 * the browser's native print dialog. The admin view additionally breaks out
 * the platform fee, since admin needs to see the full money trail.
 */
function ReceiptModal({ transaction, onClose }: { transaction: DbTransaction; onClose: () => void }) {
  const receiptNo = transaction.mpesa_receipt || `GK-${String(transaction.id).slice(0, 8).toUpperCase()}`;
  const paidOn = format(new Date(transaction.created_at), "d MMM yyyy, HH:mm");

  const handleDownload = () => {
    const html = buildReceiptHtml({
      receiptNo,
      tenantName: transaction.tenant_name ?? "—",
      landlordName: transaction.landlord_name ?? "—",
      propertyName: transaction.property_name ?? "—",
      amount: formatKsh(transaction.amount),
      adminFee: formatKsh(transaction.admin_fee),
      landlordAmount: formatKsh(transaction.landlord_amount),
      paidOn,
      status: transaction.status,
    });

    const printWindow = window.open("", "_blank", "width=420,height=680");
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
          <Row label="Landlord" value={transaction.landlord_name ?? "—"} />
          <Row label="Property" value={transaction.property_name ?? "—"} />
          <Row label="Amount paid" value={formatKsh(transaction.amount)} />
          <Row label="Platform fee (1%)" value={formatKsh(transaction.admin_fee)} />
          <Row label="Landlord received" value={formatKsh(transaction.landlord_amount)} bold />
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
  landlordName: string;
  propertyName: string;
  amount: string;
  adminFee: string;
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
    <div class="sub">Receipt ${data.receiptNo} — Admin copy</div>
    <table>
      <tr><td>Tenant</td><td>${escapeHtml(data.tenantName)}</td></tr>
      <tr><td>Landlord</td><td>${escapeHtml(data.landlordName)}</td></tr>
      <tr><td>Property</td><td>${escapeHtml(data.propertyName)}</td></tr>
      <tr><td>Status</td><td>${escapeHtml(data.status)}</td></tr>
      <tr><td>Date</td><td>${escapeHtml(data.paidOn)}</td></tr>
      <tr><td>Amount paid</td><td>${escapeHtml(data.amount)}</td></tr>
      <tr><td>Platform fee (1%)</td><td>${escapeHtml(data.adminFee)}</td></tr>
      <tr class="total"><td>Landlord received</td><td>${escapeHtml(data.landlordAmount)}</td></tr>
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