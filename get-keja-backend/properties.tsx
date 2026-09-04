import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  adminListProperties,
  adminApproveProperty,
  adminRejectProperty,
  formatKsh,
  type DbProperty,
} from "@/lib/keja-api";
import { CheckCircle2, Clock, XCircle, Loader2, X, Home, MapPin } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/properties")({
  head: () => ({ meta: [{ title: "Listings — Admin" }] }),
  component: AdminPropertiesPage,
});

function AdminPropertiesPage() {
  const [rows, setRows] = useState<DbProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "active" | "rejected" | "all">("pending");
  const [rejectTarget, setRejectTarget] = useState<DbProperty | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    adminListProperties(filter)
      .then(setRows)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load listings."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const pendingCount = useMemo(() => rows.filter((r) => r.status === "pending").length, [rows]);

  const approve = async (p: DbProperty) => {
    setBusyId(p.id);
    try {
      await adminApproveProperty(p.id);
      toast.success(`"${p.name}" is now live`);
      load();
    } catch (err: any) {
      toast.error(err.message || "Could not approve listing.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Listings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review new properties before they're visible to tenants. Approving sets status to "active"; rejecting
          notifies the landlord.
        </p>
      </header>

      <div className="inline-flex rounded-full border border-border p-1 bg-card">
        {(["pending", "active", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 h-8 rounded-full text-xs capitalize font-medium relative ${
              filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {f}
            {f === "pending" && pendingCount > 0 && filter !== "pending" && (
              <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-amber-500 text-white text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid place-items-center py-24 text-sm text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading listings…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No {filter !== "all" ? filter : ""} listings.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-4 flex gap-4">
              <div className="h-20 w-28 shrink-0 rounded-xl bg-surface overflow-hidden">
                {p.cover_image ? (
                  <img src={p.cover_image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full grid place-items-center text-muted-foreground">
                    <Home className="h-6 w-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display font-bold truncate">{p.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" /> {p.estate ? `${p.estate}, ` : ""}
                      {p.county}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {p.landlord_name ?? "—"} · {p.landlord_email ?? "—"}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-muted-foreground">
                    {formatKsh(p.monthly_rent)}/mo · {p.house_type} · submitted{" "}
                    {format(new Date(p.created_at), "d MMM, HH:mm")}
                  </div>

                  {p.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setRejectTarget(p)}
                        className="text-xs font-semibold text-destructive hover:underline"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => approve(p)}
                        disabled={busyId === p.id}
                        className="text-xs font-semibold text-accent hover:underline disabled:opacity-50"
                      >
                        {busyId === p.id ? "Approving…" : "Approve"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          property={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={() => {
            setRejectTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: typeof CheckCircle2; cls: string }> = {
    active: { icon: CheckCircle2, cls: "text-green-600" },
    pending: { icon: Clock, cls: "text-amber-500" },
    rejected: { icon: XCircle, cls: "text-destructive" },
  };
  const { icon: Icon, cls } = map[status] ?? { icon: Clock, cls: "text-muted-foreground" };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold capitalize shrink-0 ${cls}`}>
      <Icon className="h-3.5 w-3.5" /> {status}
    </span>
  );
}

function RejectModal({
  property,
  onClose,
  onDone,
}: {
  property: DbProperty;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await adminRejectProperty(property.id, reason.trim() || undefined);
      toast.success("Listing rejected");
      onDone();
    } catch (err: any) {
      toast.error(err.message || "Could not reject listing.");
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

        <h3 className="font-display font-bold text-lg">Reject this listing</h3>
        <p className="text-xs text-muted-foreground mt-1">{property.name}</p>

        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Reason (sent to the landlord)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Photos don't match the description, missing address details…"
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={submit}
          disabled={submitting}
          className="mt-6 w-full rounded-xl py-2.5 text-sm font-semibold bg-destructive text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Confirm reject"}
        </button>
      </div>
    </div>
  );
}
