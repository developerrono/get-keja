import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminListVerifications, adminUpdateVerification } from "@/lib/keja-api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/dashboard/admin/verifications")({ component: Verifications });

function Verifications() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminListVerifications>>>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const load = () => adminListVerifications().then(setRows);
  useEffect(() => { load(); }, []);

  const act = async (id: string, status: "approved" | "rejected" | "info_requested") => {
    if (!user) return;
    try {
      await adminUpdateVerification(id, { status, admin_notes: notes[id] ?? null }, user.id);
      toast.success(`Marked ${status}`); load();
    } catch { toast.error("Update failed"); }
  };

  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Landlord verification queue</h1>
      <div className="mt-6 space-y-4">
        {rows.map((v) => {
          const ll = (v as unknown as { landlord: { full_name: string | null; email: string | null; avatar_url: string | null; phone: string | null } }).landlord;
          return (
            <div key={v.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold flex items-center gap-2">{v.full_name} {v.status === "approved" && <ShieldCheck className="h-4 w-4 text-accent" />}</div>
                  <div className="text-xs text-muted-foreground">{ll?.email} · {v.phone ?? "no phone"}</div>
                  <div className="text-xs mt-1">National ID: {v.national_id}</div>
                  {v.business_name && <div className="text-xs">Business: {v.business_name}</div>}
                  <div className="mt-2 flex gap-3">
                    {v.id_photo_url && <a href={v.id_photo_url} target="_blank" rel="noreferrer" className="text-xs text-accent underline">ID photo</a>}
                    {v.selfie_url && <a href={v.selfie_url} target="_blank" rel="noreferrer" className="text-xs text-accent underline">Selfie</a>}
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${v.status === "approved" ? "bg-accent text-accent-foreground" : v.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-muted"}`}>{v.status}</span>
              </div>
              <Textarea placeholder="Admin notes..." value={notes[v.id] ?? v.admin_notes ?? ""} onChange={(e) => setNotes({ ...notes, [v.id]: e.target.value })} className="mt-3" />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => act(v.id, "approved")}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => act(v.id, "info_requested")}>Request info</Button>
                <Button size="sm" variant="outline" onClick={() => act(v.id, "rejected")}>Reject</Button>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">No verification requests.</div>}
      </div>
    </div>
  );
}
