import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { adminListPayouts, adminMarkPayoutPaid, adminRejectPayout, formatKsh, type DbPayout } from "@/lib/keja-api";
import { CheckCircle2, Clock, XCircle, Loader2, X, Wallet } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/payouts")({
  head: () => ({ meta: [{ title: "Payouts — Admin" }] }),
  component: AdminPayoutsPage,
});

function AdminPayoutsPage() {
  const [rows, setRows] = useState<DbPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "paid" | "rejected" | "all">("pending");
  const [actionPayout, setActionPayout] = useState<{ payout: DbPayout; kind: "pay" | "reject" } | null>(null);

  const load = () => {
    setLoading(true);
    adminListPayouts()
      .then(setRows)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load payouts."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  const totals = useMemo(() => ({
    pendingCount: rows.filter((r) => r.status === "pending").length,
    pendingAmount: rows.filter((r) => r.status === "pending").reduce((s, r) => s + Number(r.amount), 0),
    paidAmount: rows.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0),
  }), [rows]);

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Payouts</h1>
        <p className="text-sm text-muted-foreground mt-1">Landlord withdrawal requests. Send the M-Pesa payment yourself, then mark it paid here.</p>
      </header>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatBlock label="Pending requests" value={String(totals.pendingCount)} />
        <StatBlock label="Pending amount" value={formatKsh(totals.pendingAmount)} highlight />
        <StatBlock label="Total paid out" value={formatKsh(totals.paidAmount)} />
      </div>

      <div className="inline-flex rounded-full border border-border p-1 bg-card">
        {(["pending", "paid", "rejected", "all"] as const).map((f) => (
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
        <div className="grid place-items-center py-24 text-sm text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading payouts…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No {filter !== "all" ? filter : ""} payout requests.
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Landlord</th>
                <th className="text-right p-3">Amount</th>
                <th className="text-left p-3">Phone</th>
                <th className="text-left p-3">Requested</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Reference / notes</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3">
                    <div className="font-medium">{p.landlord_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{p.landlord_email}</div>
                  </td>
                  <td className="p-3 text-right font-semibold">{formatKsh(p.amount)}</td>
                  <td className="p-3">{p.phone}</td>
                  <td className="p-3 text-muted-foreground">{format(new Date(p.requested_at), "d MMM, HH:mm")}</td>
                  <td className="p-3"><StatusBadge status={p.status} /></td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {p.mpesa_reference ?? p.admin_notes ?? "—"}
                  </td>
                  <td className="p-3 text-right">
                    {p.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setActionPayout({ payout: p, kind: "pay" })}
                          className="text-xs font-semibold text-accent hover:underline"
                        >
                          Mark paid
                        </button>
                        <button
                          onClick={() => setActionPayout({ payout: p, kind: "reject" })}
                          className="text-xs font-semibold text-destructive hover:underline"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {p.processed_at ? format(new Date(p.processed_at), "d MMM, HH:mm") : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {actionPayout && (
        <PayoutActionModal
          payout={actionPayout.payout}
          kind={actionPayout.kind}
          onClose={() => setActionPayout(null)}
          onDone={() => {
            setActionPayout(null);
            load();
          }}
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

function StatusBadge({ status }: { status: DbPayout["status"] }) {
  const map = {
    paid: { icon: CheckCircle2, cls: "text-green-600" },
    pending: { icon: Clock, cls: "text-amber-500" },
    rejected: { icon: XCircle, cls: "text-destructive" },
  } as const;
  const { icon: Icon, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold capitalize ${cls}`}>
      <Icon className="h-3.5 w-3.5" /> {status}
    </span>
  );
}

/** Mark a pending payout as paid (with the M-Pesa reference you send it under) or reject it (with a reason). */
function PayoutActionModal({
  payout,
  kind,
  onClose,
  onDone,
}: {
  payout: DbPayout;
  kind: "pay" | "reject";
  onClose: () => void;
  onDone: () => void;
}) {
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      if (kind === "pay") {
        if (!reference.trim()) {
          toast.error("Enter the M-Pesa transaction reference you sent this under.");
          setSubmitting(false);
          return;
        }
        await adminMarkPayoutPaid(payout.id, reference.trim());
        toast.success("Marked as paid");
      } else {
        await adminRejectPayout(payout.id, notes.trim() || undefined);
        toast.success("Payout rejected");
      }
      onDone();
    } catch (err: any) {
      toast.error(err.message || "Could not update payout.");
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

        <h3 className="font-display font-bold text-lg">
          {kind === "pay" ? "Mark payout as paid" : "Reject this payout"}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {payout.landlord_name} · {formatKsh(payout.amount)} · {payout.phone}
        </p>

        {kind === "pay" ? (
          <>
            <p className="mt-4 text-xs text-muted-foreground">
              Send {formatKsh(payout.amount)} to {payout.phone} via your own M-Pesa app first, then record the
              transaction reference here.
            </p>
            <div className="mt-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">M-Pesa reference</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. QCD7XXXXX"
                className="mt-1.5 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
              />
            </div>
          </>
        ) : (
          <div className="mt-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reason (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        )}

        <button
          onClick={submit}
          disabled={submitting}
          className={`mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
            kind === "pay" ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-destructive text-white hover:opacity-90"
          }`}
        >
          {submitting ? "Saving…" : kind === "pay" ? "Confirm paid" : "Confirm reject"}
        </button>
      </div>
    </div>
  );
}
