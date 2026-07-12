import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

type SearchParams = {
  redirect?: string;
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [{ title: "Sign in — GetKeja" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getDashboardPath = (role: string) => {
    switch (role) {
      case "admin":
        return "/dashboard/admin";
      case "landlord":
      case "verified_landlord":
        return "/dashboard/landlord";
      default:
        return "/dashboard/tenant";
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("keja_user");

    if (storedUser) {
      const user = JSON.parse(storedUser);

      navigate({
        to: redirect ?? getDashboardPath(user.role),
        replace: true,
      });
    }
  }, [redirect, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = schema.safeParse({ email, password });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        "http://localhost/get-keja-backend/login.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(parsed.data),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Welcome back!");

        localStorage.setItem("keja_user", JSON.stringify(result.user));

        navigate({
          to: redirect ?? getDashboardPath(result.user.role),
          replace: true,
        });
      } else {
        toast.error(result.message || "Invalid email or password.");
      }
    } catch (error) {
      toast.error("Server connection failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome home." subtitle="Literally.">
      <h1 className="font-display text-3xl font-bold">Sign in to GetKeja</h1>
      <p className="text-sm text-muted-foreground mt-1">Continue your house hunt.</p>

      <form className="space-y-4 mt-8" onSubmit={handleLogin}>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 h-11 rounded-xl"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-accent font-semibold">
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 h-11 rounded-xl"
            required
          />
        </div>

        <Button type="submit" className="w-full h-11 rounded-xl gap-2" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Login
        </Button>
      </form>

      <p className="mt-6 text-xs text-muted-foreground text-center">
        New here?{" "}
        <Link to="/signup" className="text-accent font-semibold inline-flex items-center gap-1">
          Create an account
          <ArrowRight className="h-3 w-3" />
        </Link>
      </p>
    </AuthLayout>
  );
}
