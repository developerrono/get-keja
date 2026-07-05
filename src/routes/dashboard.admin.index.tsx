import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { adminStats } from "@/lib/keja-api";
import { Users, UserCog, ShieldCheck, Building2, Flag, Star, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/dashboard/admin/")({ component: Overview });

function Overview() {
  const [s, setS] = useState<Awaited<ReturnType<typeof adminStats>> | null>(null);
  useEffect(() => { adminStats().then(setS); }, []);
  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-3xl font-bold">Platform overview</h1>
      <p className="text-sm text-muted-foreground mt-1">Monitor users, listings and reports across GetKeja.</p>
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total users" value={String(s?.totalUsers ?? "—")} icon={Users} />
        <StatCard label="Landlords" value={String(s?.totalLandlords ?? "—")} icon={UserCog} />
        <StatCard label="Verified landlords" value={String(s?.verifiedLandlords ?? "—")} icon={ShieldCheck} />
        <StatCard label="Pending verifications" value={String(s?.pendingVerifications ?? "—")} icon={ShieldCheck} />
        <StatCard label="Total properties" value={String(s?.totalProperties ?? "—")} icon={Building2} />
        <StatCard label="Active listings" value={String(s?.activeListings ?? "—")} icon={Building2} />
        <StatCard label="Flagged listings" value={String(s?.flaggedListings ?? "—")} icon={AlertTriangle} />
        <StatCard label="Open reports" value={String(s?.openReports ?? "—")} icon={Flag} />
        <StatCard label="Total reviews" value={String(s?.totalReviews ?? "—")} icon={Star} />
      </div>
    </div>
  );
}
