import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminListUsers } from "@/lib/keja-api";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/dashboard/admin/landlords")({ component: LandlordsPage });

function LandlordsPage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminListUsers>>>([]);
  useEffect(() => { adminListUsers().then((r) => setRows(r.filter((u) => u.roles.some((x) => x === "landlord" || x === "verified_landlord")))); }, []);
  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Landlords</h1>
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((u) => (
          <div key={u.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="font-semibold flex items-center gap-1">{u.full_name ?? "Landlord"} {u.is_verified && <ShieldCheck className="h-4 w-4 text-accent" />}</div>
            <div className="text-xs text-muted-foreground">{u.email}</div>
            <div className="text-xs mt-2">{u.roles.join(", ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
