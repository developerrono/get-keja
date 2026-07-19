import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
    if (profile) {
      setName(profile.fullName ?? "");
      setPhone(profile.phone ?? "");
      setBio(profile.bio ?? "");
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("http://localhost/get-keja-backend/update-profile.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, full_name, phone, bio }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      // Keep localStorage (and thus useAuth) in sync with the update
      const stored = localStorage.getItem("keja_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem("keja_user", JSON.stringify({ ...parsed, fullName: full_name, phone, bio }));
      }

      toast.success("Profile updated");
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
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
