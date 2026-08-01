import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Lock } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";

const schema = z
  .object({
    password: z.string().min(6, "At least 6 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

type SearchParams = { token?: string };

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({ meta: [{ title: "Reset password — GetKeja" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("This reset link is missing its token — request a new one.");
      return;
    }
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("http://localhost/get-keja-backend/reset-password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: parsed.data.password }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setDone(true);
      toast.success("Password updated — you can sign in now.");
    } catch (err: any) {
      toast.error(err.message || "Could not reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Link problem" subtitle="Let's get you a new one.">
        <Link to="/forgot-password" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
        <h1 className="font-display text-3xl font-bold mt-4">This link is missing its token</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Make sure you opened the exact link that was generated — or request a new one.
        </p>
        <Link to="/forgot-password">
          <Button className="mt-6 rounded-xl h-11">Request a new link</Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Almost there." subtitle="Pick a new password.">
      <Link to="/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to sign in
      </Link>
      <h1 className="font-display text-3xl font-bold mt-4">Set a new password</h1>
      <p className="text-sm text-muted-foreground mt-1">Choose something you haven't used before.</p>

      {done ? (
        <div className="mt-8 rounded-xl border border-border bg-primary-soft p-5 text-sm space-y-3">
          <p className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-accent" /> Password updated
          </p>
          <p className="text-muted-foreground">You can now sign in with your new password.</p>
          <Button onClick={() => navigate({ to: "/login" })} className="w-full rounded-xl h-11">
            Go to sign in
          </Button>
        </div>
      ) : (
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
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
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Update password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
