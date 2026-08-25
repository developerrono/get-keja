import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, Loader2, Mail, User, Phone, CheckCircle2, XCircle } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/hooks/use-auth";
import { emailFieldState, phoneFieldState } from "@/lib/validators";

const OWNERSHIP_TYPES = [
  { value: "owner", label: "I own the property/properties" },
  { value: "manager", label: "I manage on behalf of an owner" },
  { value: "agent", label: "I'm a letting agent" },
] as const;

const PROPERTY_COUNTS = [
  { value: "1", label: "Just 1" },
  { value: "2-5", label: "2 – 5" },
  { value: "6-15", label: "6 – 15" },
  { value: "16+", label: "16 or more" },
] as const;

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Tell us your name").max(80),
    email: z.string().trim().email("Enter a valid email").max(255),
    phone: z
      .string()
      .trim()
      .min(9, "Enter a valid phone number")
      .regex(/^(0|\+?254)?[71]\d{8}$/, "Use a Kenyan number, e.g. 07XXXXXXXX"),
    password: z.string().min(6, "At least 6 characters").max(72),
    confirm: z.string(),
    role: z.enum(["tenant", "landlord"]),
    ownershipType: z.string().optional(),
    propertiesCount: z.string().optional(),
    businessName: z.string().trim().max(120).optional(),
    idNumber: z.string().trim().max(40).optional(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  })
  .superRefine((d, ctx) => {
    if (d.role === "landlord") {
      if (!d.ownershipType) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tell us your role with the property", path: ["ownershipType"] });
      }
      if (!d.propertiesCount) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select how many properties you have", path: ["propertiesCount"] });
      }
    }
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
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("tenant");

  // Landlord-only fields
  const [ownershipType, setOwnershipType] = useState("");
  const [propertiesCount, setPropertiesCount] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [idNumber, setIdNumber] = useState("");

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
    const parsed = schema.safeParse({
      fullName, email, phone, password, confirm, role: selectedRole,
      ownershipType: selectedRole === "landlord" ? ownershipType : undefined,
      propertiesCount: selectedRole === "landlord" ? propertiesCount : undefined,
      businessName: selectedRole === "landlord" ? businessName : undefined,
      idNumber: selectedRole === "landlord" ? idNumber : undefined,
    });
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
            phone: parsed.data.phone,
            password: parsed.data.password,
            role: parsed.data.role,
            // Landlord-only extras — signup.php needs to accept and persist
            // these on the users table (see note below).
            ownership_type: parsed.data.ownershipType ?? null,
            properties_count: parsed.data.propertiesCount ?? null,
            business_name: parsed.data.businessName || null,
            id_number: parsed.data.idNumber || null,
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="email" className="text-xs">Email</Label>
            <div className="relative mt-1.5">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`h-11 rounded-xl pr-9 ${
                  email && emailFieldState(email) === "valid"
                    ? "border-green-500 focus-visible:ring-green-500"
                    : email && emailFieldState(email) === "invalid"
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }`}
                required
              />
              {email && emailFieldState(email) === "valid" && (
                <CheckCircle2 className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
              )}
              {email && emailFieldState(email) === "invalid" && (
                <XCircle className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-destructive" />
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="phone" className="text-xs">Phone (M-Pesa)</Label>
            <div className="relative mt-1.5">
              <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                className={`h-11 rounded-xl pl-9 pr-9 ${
                  phone && phoneFieldState(phone) === "valid"
                    ? "border-green-500 focus-visible:ring-green-500"
                    : phone && phoneFieldState(phone) === "invalid"
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }`}
                required
              />
              {phone && phoneFieldState(phone) === "valid" && (
                <CheckCircle2 className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
              )}
              {phone && phoneFieldState(phone) === "invalid" && (
                <XCircle className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-destructive" />
              )}
            </div>
          </div>
        </div>

        {selectedRole === "landlord" && (
          <div className="rounded-xl border border-border bg-surface p-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">A bit about your property</p>
            <div>
              <Label className="text-xs">Your role with the property</Label>
              <Select value={ownershipType} onValueChange={setOwnershipType}>
                <SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue placeholder="Select one" /></SelectTrigger>
                <SelectContent>
                  {OWNERSHIP_TYPES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">How many properties do you plan to list?</Label>
              <Select value={propertiesCount} onValueChange={setPropertiesCount}>
                <SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue placeholder="Select one" /></SelectTrigger>
                <SelectContent>
                  {PROPERTY_COUNTS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="businessName" className="text-xs">Business name (optional)</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Kilimani Homes Ltd"
                  className="mt-1.5 h-11 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="idNumber" className="text-xs">National ID / KRA PIN (optional)</Label>
                <Input
                  id="idNumber"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="For verification later"
                  className="mt-1.5 h-11 rounded-xl"
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              This isn't checked at signup — it just speeds up landlord verification later. You can add or edit it anytime from your profile.
            </p>
          </div>
        )}

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
