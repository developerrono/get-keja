import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Chrome, Loader2, Mail } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth, dashboardPathForRole } from "@/hooks/use-auth";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});

type SearchParams = { redirect?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Sign in — GetKeja" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const { user, role, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: redirect ?? dashboardPathForRole(role), replace: true });
    }
  }, [loading, user, role, redirect, navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/login",
    });
    if (result.error) {
      setGoogleLoading(false);
      toast.error(result.error.message || "Could not sign in with Google");
    }
    // if redirected the browser will navigate away; if tokens returned the
    // onAuthStateChange listener will trigger and the redirect above runs.
  };

  return (
    <AuthLayout title="Welcome home." subtitle="Literally.">
      <h1 className="font-display text-3xl font-bold">Sign in to GetKeja</h1>
      <p className="text-sm text-muted-foreground mt-1">Continue your house hunt.</p>

      <Button
        variant="outline"
        className="mt-8 w-full rounded-xl gap-2 h-11"
        onClick={handleGoogle}
        disabled={googleLoading}
      >
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Chrome className="h-4 w-4" />}
        Continue with Google
      </Button>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <form className="space-y-3" onSubmit={handleEmail}>
        <div>
          <Label htmlFor="email" className="text-xs">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 h-11 rounded-xl"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs">Password</Label>
            <Link to="/forgot-password" className="text-xs text-accent font-semibold">
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 h-11 rounded-xl"
            required
          />
        </div>
        <Button type="submit" className="w-full rounded-xl h-11 gap-2" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Continue with email
        </Button>
      </form>

      <p className="mt-6 text-xs text-muted-foreground text-center">
        New here?{" "}
        <Link to="/signup" className="text-accent font-semibold inline-flex items-center gap-1">
          Create an account <ArrowRight className="h-3 w-3" />
        </Link>
      </p>
    </AuthLayout>
  );
}
