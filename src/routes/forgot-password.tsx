import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";

const schema = z.object({ email: z.string().trim().email("Enter a valid email").max(255) });

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — GetKeja" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("http://localhost/get-keja-backend/forgot-password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data.email }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setDevLink(json.dev_reset_link ?? null);
      setSent(true);
      toast.success("Reset link generated.");
    } catch (err: any) {
      toast.error(err.message || "Could not process request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Forgot it?" subtitle="No worries.">
      <Link to="/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to sign in
      </Link>
      <h1 className="font-display text-3xl font-bold mt-4">Reset your password</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Enter your email and we'll generate a secure reset link.
      </p>

      {sent ? (
        <div className="mt-8 rounded-xl border border-border bg-primary-soft p-5 text-sm space-y-3">
          <p className="font-semibold">Link generated 📬</p>
          <p className="text-muted-foreground">
            If <span className="text-foreground font-medium">{email}</span> is registered, a reset link
            was created. It expires in 1 hour.
          </p>
          {devLink && (
            <div className="rounded-lg bg-background border border-border p-3">
              <p className="text-xs text-muted-foreground mb-1">
                Dev mode: no email server is configured, so here's the link directly —
              </p>
              <a href={devLink} className="text-xs text-accent break-all underline">{devLink}</a>
            </div>
          )}
        </div>
      ) : (
        <form className="mt-8 space-y-3" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 h-11 rounded-xl"
              required
            />
          </div>
          <Button type="submit" className="w-full rounded-xl h-11 gap-2" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
