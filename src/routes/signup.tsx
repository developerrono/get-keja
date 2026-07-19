import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, Loader2, Mail, User } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/hooks/use-auth";

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Tell us your name").max(80),
    email: z.string().trim().email("Enter a valid email").max(255),
    password: z.string().min(6, "At least 6 characters").max(72),
    confirm: z.string(),
    role: z.enum(["tenant", "landlord"]),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type AppRole = "tenant" | "landlord";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — GetKeja" }] }),
  component: SignupPage,
});

function getDashboardPath(role: string) {
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "landlord":
    case "verified_landlord":
      return "/dashboard/landlord";
    default:
      return "/dashboard/tenant";
  }
}

function SignupPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("tenant");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("keja_user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      navigate({ to: getDashboardPath(user.role), replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ fullName, email, password, confirm, role: selectedRole });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        "http://localhost/get-keja-backend/signup.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: parsed.data.fullName,
            email: parsed.data.email,
            password: parsed.data.password,
            role: parsed.data.role,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Account created! Signing you in...");
        localStorage.setItem("keja_user", JSON.stringify(result.user));
        // Client-side navigate() doesn't remount AuthProvider, and localStorage's
        // "storage" event only fires in *other* tabs — so without this, useAuth().user
        // stays null in memory even though localStorage is already correct.
        await refresh();
        navigate({ to: getDashboardPath(result.user.role), replace: true });
      } else {
        toast.error(result.message || "Could not create account.");
      }
    } catch (error) {
      toast.error("Server connection failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Start your hunt." subtitle="It's free.">
      <h1 className="font-display text-3xl font-bold">Create your account</h1>
      <p className="text-sm text-muted-foreground mt-1">Tenant or landlord — we've got you.</p>

      <form className="space-y-3 mt-6" onSubmit={handleSubmit}>
        <div>
          <Label className="text-xs">I am a...</Label>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {(
              [
                { value: "tenant", label: "Tenant", icon: User },
                { value: "landlord", label: "Landlord", icon: Building2 },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedRole(value)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-3 text-sm font-semibold transition-colors ${
                  selectedRole === value
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="fullName" className="text-xs">Full name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Amani Mwangi"
            className="mt-1.5 h-11 rounded-xl"
            required
          />
        </div>
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="password" className="text-xs">Password</Label>
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
            <Label htmlFor="confirm" className="text-xs">Confirm</Label>
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
        </div>

        <Button type="submit" className="w-full rounded-xl h-11 gap-2 mt-2" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-xs text-muted-foreground text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-accent font-semibold inline-flex items-center gap-1">
          Sign in <ArrowRight className="h-3 w-3" />
        </Link>
      </p>
    </AuthLayout>
  );
}