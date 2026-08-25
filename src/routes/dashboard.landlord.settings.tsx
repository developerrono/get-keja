import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ValidatedInput } from "@/components/shared/ValidatedInput";
import { VerifyContactCard } from "@/components/shared/VerifyContactCard";
import { phoneFieldState, emailFieldState } from "@/lib/validators";
import { useAuth } from "@/hooks/use-auth";
import { deactivateAccount, logoutFromXampp } from "@/lib/keja-api";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/landlord/settings")({
  head: () => ({ meta: [{ title: "Settings — Landlord" }] }),
  component: SettingsPage,
});

const TABS = ["Profile", "Business", "Notifications", "Password", "Security", "Deactivate"] as const;
type Tab = (typeof TABS)[number];

function SettingsPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Profile");
  const [notif, setNotif] = useState({ email: true, sms: false, push: true, marketing: false });

  const [profileEmail, setProfileEmail] = useState(profile?.email ?? "");
  const [profilePhone, setProfilePhone] = useState(profile?.phone ?? "");

  // ---- Deactivate flow ----
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const handleDeactivate = async () => {
    if (!profile?.id) return;
    if (reason.trim().length < 10) {
      toast.error("Please give a short reason (at least 10 characters) before deactivating.");
      return;
    }
    setDeactivating(true);
    try {
      await deactivateAccount({ user_id: profile.id, reason: reason.trim() });
      toast.success("Your account has been deactivated.");
      logoutFromXampp();
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message || "Couldn't deactivate your account.");
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences.</p>
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
        <nav className="rounded-2xl border border-border bg-card p-2 h-fit">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              } ${t === "Deactivate" ? "text-destructive" : ""}`}
            >
              {t}
            </button>
          ))}
        </nav>

        <section className="rounded-2xl border border-border bg-card p-6">
          {tab === "Profile" && (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Profile updated"); }}>
              <h2 className="font-display font-bold text-lg">Profile information</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <FieldRow label="Full name"><Input defaultValue={profile?.full_name ?? ""} /></FieldRow>
                <FieldRow label="Email">
                  <ValidatedInput
                    type="email"
                    state={emailFieldState(profileEmail)}
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    invalidText="Enter a valid email address."
                  />
                </FieldRow>
                <FieldRow label="Phone">
                  <ValidatedInput
                    state={phoneFieldState(profilePhone)}
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+254…"
                    invalidText="Enter a valid Kenyan phone number."
                  />
                </FieldRow>
                <FieldRow label="Avatar URL"><Input defaultValue={profile?.avatar_url ?? ""} /></FieldRow>
              </div>
              <div className="flex justify-end"><Button type="submit">Save changes</Button></div>
            </form>
          )}

          {tab === "Business" && (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Business details saved"); }}>
              <h2 className="font-display font-bold text-lg">Business details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <FieldRow label="Business name"><Input placeholder="e.g. GetKeja Rentals Ltd" /></FieldRow>
                <FieldRow label="KRA PIN"><Input placeholder="A000000000X" /></FieldRow>
                <FieldRow label="Business phone"><Input /></FieldRow>
                <FieldRow label="Business email"><Input type="email" /></FieldRow>
                <div className="md:col-span-2"><FieldRow label="Business address"><Textarea rows={3} /></FieldRow></div>
              </div>
              <div className="flex justify-end"><Button type="submit">Save changes</Button></div>
            </form>
          )}

          {tab === "Notifications" && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-lg">Notification preferences</h2>
              {[
                { key: "email", label: "Email notifications", desc: "New inquiries and bookings" },
                { key: "sms", label: "SMS alerts", desc: "Urgent updates via SMS" },
                { key: "push", label: "Push notifications", desc: "Real-time browser push" },
                { key: "marketing", label: "Marketing updates", desc: "Product news and tips" },
              ].map((n) => (
                <label key={n.key} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{n.label}</div>
                    <div className="text-xs text-muted-foreground">{n.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={(notif as never)[n.key]}
                    onChange={(e) => setNotif((v) => ({ ...v, [n.key]: e.target.checked }))}
                    className="h-4 w-4"
                  />
                </label>
              ))}
            </div>
          )}

          {tab === "Password" && (
            <form className="space-y-4 max-w-md" onSubmit={(e) => { e.preventDefault(); toast.success("Password updated"); }}>
              <h2 className="font-display font-bold text-lg">Change password</h2>
              <FieldRow label="Current password"><Input type="password" /></FieldRow>
              <FieldRow label="New password"><Input type="password" /></FieldRow>
              <FieldRow label="Confirm new password"><Input type="password" /></FieldRow>
              <div className="flex justify-end"><Button type="submit">Update password</Button></div>
            </form>
          )}

          {tab === "Security" && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-lg">Security</h2>

              {profile?.id && (
                <>
                  <VerifyContactCard
                    userId={profile.id}
                    channel="phone"
                    destination={profilePhone}
                    verified={Boolean(profile?.phone_verified_at)}
                  />
                  <VerifyContactCard
                    userId={profile.id}
                    channel="email"
                    destination={profileEmail}
                    verified={Boolean(profile?.email_verified_at)}
                  />
                </>
              )}

              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div>
                  <div className="font-semibold text-sm">Two-factor authentication</div>
                  <div className="text-xs text-muted-foreground">Add an extra layer of security to your account.</div>
                </div>
                <Button variant="outline" onClick={() => toast.info("2FA setup coming soon")}>Enable</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div>
                  <div className="font-semibold text-sm">Active sessions</div>
                  <div className="text-xs text-muted-foreground">Log out from all other devices.</div>
                </div>
                <Button variant="outline" onClick={() => toast.success("All other sessions signed out")}>Sign out others</Button>
              </div>
            </div>
          )}

          {tab === "Deactivate" && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-lg text-destructive">Deactivate account</h2>
              <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5 space-y-4">
                <div>
                  <div className="font-semibold">Deactivate my account</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your account and data are kept — nothing is deleted. Deactivating hides your
                    listings and signs you out. Our team reviews every deactivation for security
                    reasons, so please tell us why.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Reason for deactivating
                  </Label>
                  <Textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Taking a break from renting out, selling the property, switching platforms…"
                  />
                </div>

                {!confirming ? (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (reason.trim().length < 10) {
                        toast.error("Please give a short reason (at least 10 characters) first.");
                        return;
                      }
                      setConfirming(true);
                    }}
                  >
                    Deactivate my account
                  </Button>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-medium">Are you sure? This will sign you out.</p>
                    <Button variant="destructive" onClick={handleDeactivate} disabled={deactivating}>
                      {deactivating ? "Deactivating…" : "Yes, deactivate"}
                    </Button>
                    <Button variant="outline" onClick={() => setConfirming(false)} disabled={deactivating}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
