import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { updateProfile, uploadImage } from "@/lib/keja-api";
import { Camera, Loader2, Mail, Phone, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/dashboard/tenant/profile")({ component: TenantProfile });

const BIO_LIMIT = 300;

function TenantProfile() {
  const { user, profile, refresh } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initial, setInitial] = useState({ fullName: "", phone: "", bio: "", avatarUrl: null as string | null });

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const loaded = {
      fullName: profile.full_name ?? "",
      phone: profile.phone ?? "",
      bio: (profile as any).bio ?? "",
      avatarUrl: profile.avatar_url ?? null,
    };
    setFullName(loaded.fullName);
    setPhone(loaded.phone);
    setBio(loaded.bio);
    setAvatarUrl(loaded.avatarUrl);
    setInitial(loaded);
  }, [profile]);

  const dirty =
    fullName !== initial.fullName ||
    phone !== initial.phone ||
    bio !== initial.bio ||
    avatarUrl !== initial.avatarUrl;

  const initials = (fullName || profile?.email || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const onAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file);
      setAvatarUrl(url);
    } catch (err: any) {
      toast.error(err.message || "Could not upload photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile({
        user_id: user.id,
        full_name: fullName,
        phone,
        bio,
        avatar_url: avatarUrl ?? "",
      });

      // Keep localStorage (and thus useAuth) in sync with the update
      const stored = localStorage.getItem("keja_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem(
          "keja_user",
          JSON.stringify({ ...parsed, fullName, phone, bio, avatar_url: avatarUrl }),
        );
      }

      setInitial({ fullName, phone, bio, avatarUrl });
      toast.success("Profile updated");
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage how you appear to landlords and other tenants.</p>
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
        {/* Identity card */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center text-center h-fit">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative h-24 w-24 rounded-full group"
            aria-label="Change photo"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="h-24 w-24 rounded-full gradient-primary grid place-items-center text-primary-foreground text-2xl font-display font-bold">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-background/0 group-hover:bg-background/60 transition-colors grid place-items-center">
              {uploadingAvatar ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Camera className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={onAvatarSelected} />

          <div className="mt-4 min-w-0 w-full">
            <div className="font-semibold truncate">{fullName || "Add your name"}</div>
            <div className="text-xs text-muted-foreground truncate mt-0.5">{profile?.email}</div>
          </div>
        </div>

        {/* Editable fields */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display font-bold text-sm uppercase tracking-wide text-muted-foreground">
              Personal information
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <UserIcon className="h-3.5 w-3.5" /> Full name
                </Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" placeholder="Your full name" />
              </div>
              <div>
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> Phone number
                </Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" placeholder="07XX XXX XXX" />
              </div>
              <div>
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> Email
                </Label>
                <Input value={profile?.email ?? ""} disabled className="mt-1.5 opacity-70" />
                <p className="text-xs text-muted-foreground mt-1.5">Email changes aren't supported yet.</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-sm uppercase tracking-wide text-muted-foreground">About you</h2>
              <span className="text-xs text-muted-foreground">{bio.length}/{BIO_LIMIT}</span>
            </div>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_LIMIT))}
              rows={4}
              className="mt-3"
              placeholder="A short note landlords will see when you message or request a visit — e.g. who you're renting for, what you're looking for."
            />
          </section>

          <div className="flex justify-end gap-3">
            <Button onClick={save} disabled={saving || !dirty} className="rounded-full min-w-32">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : dirty ? "Save changes" : "Saved"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}