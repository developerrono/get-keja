import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/tenant/profile")({ component: TenantProfile });

function TenantProfile() {
  const { user, profile, refresh } = useAuth();
  const [full_name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) { setName(profile.full_name ?? ""); setPhone(profile.phone ?? ""); }
    if (user) supabase.from("profiles").select("bio").eq("id", user.id).maybeSingle().then(({ data }) => setBio(data?.bio ?? ""));
  }, [profile, user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name, phone, bio }).eq("id", user.id);
    if (error) toast.error(error.message); else { toast.success("Profile updated"); await refresh(); }
    setSaving(false);
  };

  return (
    <div className="p-6 lg:p-10 max-w-2xl">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Profile</h1>
      <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">
        <div><Label>Full name</Label><Input value={full_name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
        <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" /></div>
        <div><Label>Email</Label><Input value={profile?.email ?? ""} disabled className="mt-1" /></div>
        <div><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1" /></div>
        <Button onClick={save} disabled={saving} className="rounded-full">{saving ? "Saving..." : "Save changes"}</Button>
      </div>
    </div>
  );
}
