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
import { CheckCircle2, Clock, XCircle, Loader2, Home } from "lucide-react";
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
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-border">
                    <td className="p-3">{tx.property_name ?? "—"}</td>
                    <td className="p-3 text-right font-semibold">{formatKsh(tx.amount)}</td>
                    <td className="p-3"><StatusBadge status={tx.status} /></td>
                    <td className="p-3 text-muted-foreground">{format(new Date(tx.created_at), "d MMM, HH:mm")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
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
