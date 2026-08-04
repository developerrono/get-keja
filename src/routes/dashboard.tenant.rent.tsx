import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  listMyTenancies,
  listTransactionsForTenant,
  formatKsh,
  type DbTenancy,
  type DbTransaction,
} from "@/lib/keja-api";
import { PayRentCard } from "@/components/tenant/PayRentCard";
import { CheckCircle2, Clock, XCircle, Loader2, Home, Receipt as ReceiptIcon, X } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard/tenant/rent")({
  head: () => ({ meta: [{ title: "My Rent — GetKeja" }] }),
  component: MyRentPage,
});

function MyRentPage() {
  const { user } = useAuth();
  const [tenancies, setTenancies] = useState<DbTenancy[]>([]);
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptTx, setReceiptTx] = useState<DbTransaction | null>(null);

  const load = () => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      listMyTenancies(user.id).catch(() => []),
      listTransactionsForTenant(user.id).catch(() => []),
    ])
      .then(([t, tx]) => {
        setTenancies(t);
        setTransactions(tx);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [user]);

  const active = tenancies.find((t) => t.status === "active");

  if (loading) {
    return (
      <div className="p-6 lg:p-10 grid place-items-center py-24 text-sm text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your rent details…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-bold">My rent</h1>
        <p className="text-sm text-muted-foreground mt-1">Your tenancy, balance, and payment history.</p>
      </header>

      {!active ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Home className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            You don't have an active tenancy yet. Once you move into a property, it'll show up here.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display font-bold">{active.property_name}</h2>
            {active.unit_label && <p className="text-sm text-muted-foreground">Unit {active.unit_label}</p>}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Monthly rent</div>
                <div className="font-bold">{formatKsh(active.monthly_rent)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Balance owed</div>
                <div className={`font-bold ${active.balance > 0 ? "text-destructive" : "text-accent"}`}>
                  {formatKsh(active.balance)}
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Tenant since {format(new Date(active.since_date), "d MMM yyyy")}
            </div>
          </div>

          <PayRentCard
            tenantId={active.tenant_id}
            landlordId={active.landlord_id}
            tenancyId={active.id}
            propertyId={active.property_id}
            unitId={active.unit_id}
            suggestedAmount={active.balance > 0 ? active.balance : undefined}
          />
        </div>
      )}

      <section>
        <h2 className="font-display font-bold text-lg mb-3">Payment history</h2>
        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No payments yet.
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Property</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-right p-3">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-border">
                    <td className="p-3">{tx.property_name ?? "—"}</td>
                    <td className="p-3 text-right font-semibold">{formatKsh(tx.amount)}</td>
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
      </section>

      {receiptTx && (
        <ReceiptModal
          transaction={receiptTx}
          tenancy={active}
          tenantName={user?.name ?? user?.email ?? "Tenant"}
          onClose={() => setReceiptTx(null)}
        />
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

/**
 * Receipt generator: renders a formatted receipt for a successful transaction
 * inside a modal, and can print/export it to PDF via the browser's native
 * print dialog (no extra PDF dependency required).
 */
function ReceiptModal({
  transaction,
  tenancy,
  tenantName,
  onClose,
}: {
  transaction: DbTransaction;
  tenancy: DbTenancy | undefined;
  tenantName: string;
  onClose: () => void;
}) {
  const receiptNo = `GK-${String(transaction.id).slice(0, 8).toUpperCase()}`;
  const paidOn = format(new Date(transaction.created_at), "d MMM yyyy, HH:mm");

  const handleDownload = () => {
    const html = buildReceiptHtml({
      receiptNo,
      tenantName,
      propertyName: transaction.property_name ?? tenancy?.property_name ?? "—",
      unitLabel: tenancy?.unit_label,
      amount: formatKsh(transaction.amount),
      paidOn,
      status: transaction.status,
    });

    const printWindow = window.open("", "_blank", "width=420,height=640");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // Give the window a moment to render before invoking print (Save as PDF).
    setTimeout(() => printWindow.print(), 250);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center mb-5">
          <ReceiptIcon className="h-6 w-6 mx-auto text-primary" />
          <h3 className="font-display font-bold text-lg mt-2">Payment receipt</h3>
          <p className="text-xs text-muted-foreground">{receiptNo}</p>
        </div>

        <dl className="space-y-3 text-sm">
          <Row label="Tenant" value={tenantName} />
          <Row label="Property" value={transaction.property_name ?? tenancy?.property_name ?? "—"} />
          {tenancy?.unit_label && <Row label="Unit" value={tenancy.unit_label} />}
          <Row label="Amount paid" value={formatKsh(transaction.amount)} bold />
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
  unitLabel?: string | null;
  amount: string;
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
      ${data.unitLabel ? `<tr><td>Unit</td><td>${escapeHtml(data.unitLabel)}</td></tr>` : ""}
      <tr><td>Status</td><td>${escapeHtml(data.status)}</td></tr>
      <tr><td>Date</td><td>${escapeHtml(data.paidOn)}</td></tr>
      <tr class="total"><td>Amount paid</td><td>${escapeHtml(data.amount)}</td></tr>
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