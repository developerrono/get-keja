import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { listMyTenancies, listTransactionsForTenant, formatKsh, type DbTenancy, type DbTransaction } from "@/lib/keja-api";
import { PayRentCard } from "@/components/tenant/PayRentCard";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard/tenant/rent")({
  head: () => ({ meta: [{ title: "My Rent — Tenant" }] }),
  component: RentPage,
});

function RentPage() {
  const { user } = useAuth();
  const [tenancies, setTenancies] = useState<(DbTenancy & { cover_image: string | null })[]>([]);
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([listMyTenancies(user.id), listTransactionsForTenant(user.id)])
      .then(([t, tx]) => {
        setTenancies(t);
        setTransactions(tx);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const activeTenancy = tenancies.find((t) => t.status === "active");

  if (loading) {
    return <div className="p-6 lg:p-10 text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-bold">My rent</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your lease and pay rent via M-Pesa.</p>
      </header>

      {!activeTenancy ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          You don't have an active tenancy yet. Move in to a property from its listing page to get started.
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              {activeTenancy.cover_image && (
                <img src={activeTenancy.cover_image} alt="" className="h-16 w-16 rounded-xl object-cover" />
              )}
              <div>
                <h2 className="font-display font-bold text-lg">{activeTenancy.property_name}</h2>
                {activeTenancy.unit_label && (
                  <p className="text-xs text-muted-foreground">Unit {activeTenancy.unit_label}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  Since {format(new Date(activeTenancy.since_date), "MMM yyyy")}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Monthly rent</p>
                <p className="font-display font-bold text-lg">{formatKsh(activeTenancy.monthly_rent)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Balance owed</p>
                <p className={`font-display font-bold text-lg ${activeTenancy.balance > 0 ? "text-destructive" : "text-green-600"}`}>
                  {formatKsh(activeTenancy.balance)}
                </p>
              </div>
            </div>
          </div>

          <PayRentCard
            tenantId={activeTenancy.tenant_id}
            landlordId={activeTenancy.landlord_id}
            tenancyId={activeTenancy.id}
            propertyId={activeTenancy.property_id}
            unitId={activeTenancy.unit_id}
            suggestedAmount={activeTenancy.balance > 0 ? activeTenancy.balance : activeTenancy.monthly_rent}
          />
        </>
      )}

      <div>
        <h2 className="font-display font-bold text-lg mb-3">Payment history</h2>
        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No payments yet.
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-3">
                  {tx.status === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {tx.status === "pending" && <Clock className="h-4 w-4 text-amber-500" />}
                  {tx.status === "failed" && <XCircle className="h-4 w-4 text-destructive" />}
                  <div>
                    <p className="text-sm font-semibold">{formatKsh(tx.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.created_at), "d MMM yyyy, HH:mm")}
                      {tx.mpesa_receipt && ` • ${tx.mpesa_receipt}`}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-semibold capitalize ${
                  tx.status === "success" ? "text-green-600" : tx.status === "pending" ? "text-amber-500" : "text-destructive"
                }`}>
                  {tx.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
