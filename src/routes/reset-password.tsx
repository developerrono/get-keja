import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { supabase } from "@/integrations/supabase/client";

const schema = z
  .object({
    password: z.string().min(6, "At least 6 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — GetKeja" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);

  useEffect(() => {
    // Supabase puts type=recovery in the URL hash on reset links.
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    if (params.get("type") === "recovery") setHasRecovery(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setHasRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    toast.success("Password updated. You're signed in.");
    setTimeout(() => navigate({ to: "/" }), 1500);
  };

  return (
    <AuthLayout title="Almost there." subtitle="One last step.">
      <h1 className="font-display text-3xl font-bold">Set a new password</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Choose a strong password you'll remember.
      </p>

      {done ? (
        <div className="mt-8 rounded-xl border border-border bg-primary-soft p-5 text-sm flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Password updated</p>
            <p className="text-muted-foreground mt-1">Redirecting you home…</p>
          </div>
        </div>
      ) : (
        <form className="mt-8 space-y-3" onSubmit={handleSubmit}>
          {!hasRecovery && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              Open this page from the reset link in your email. If you didn't request a reset, you can close this tab.
            </div>
          )}
          <div>
            <Label htmlFor="password" className="text-xs">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 h-11 rounded-xl"
              required
            />
          </div>
          <div>
            <Label htmlFor="confirm" className="text-xs">Confirm new password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 h-11 rounded-xl"
              required
            />
          </div>
          <Button type="submit" className="w-full rounded-xl h-11 gap-2" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Update password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
