import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchTenantPrefs, upsertTenantPrefs, HOUSE_TYPES, KENYA_COUNTIES,
  type DbTenantPrefs,
} from "@/lib/keja-api";

export function OnboardingCard() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<DbTenantPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [county, setCounty] = useState("Nairobi");
  const [estate, setEstate] = useState("");
  const [min_budget, setMin] = useState("10000");
  const [max_budget, setMax] = useState("50000");
  const [types, setTypes] = useState<string[]>([]);
  const [move_in_date, setMove] = useState("");
  const [needs_parking, setParking] = useState(false);
  const [has_pets, setPets] = useState(false);
  const [furnished_preference, setFurn] = useState<"any" | "furnished" | "unfurnished">("any");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchTenantPrefs(user.id).then((p) => {
      setPrefs(p);
      if (p) {
        setCounty(p.counties?.[0] ?? "Nairobi");
        setEstate(p.estates?.[0] ?? "");
        setMin(String(p.min_budget ?? 10000));
        setMax(String(p.max_budget ?? 50000));
        setTypes(p.house_types ?? []);
        setMove(p.move_in_date ?? "");
        setParking(p.needs_parking);
        setPets(p.has_pets);
        setFurn((p.furnished_preference ?? "any") as never);
      }
      setLoading(false);
    });
  }, [user]);

  if (loading || !user) return null;
  if (prefs?.onboarding_dismissed || prefs?.onboarding_completed) return null;

  const dismiss = async () => {
    await upsertTenantPrefs(user.id, { onboarding_dismissed: true });
    setPrefs({ ...(prefs ?? ({} as DbTenantPrefs)), onboarding_dismissed: true });
  };

  const save = async () => {
    setSaving(true);
    try {
      await upsertTenantPrefs(user.id, {
        counties: [county],
        estates: estate ? [estate] : [],
        min_budget: Number(min_budget) || null,
        max_budget: Number(max_budget) || null,
        house_types: types,
        move_in_date: move_in_date || null,
        needs_parking, has_pets, furnished_preference,
        onboarding_completed: true,
      });
      toast.success("Preferences saved — we'll tailor your feed");
      setPrefs({ ...(prefs ?? ({} as DbTenantPrefs)), onboarding_completed: true });
    } catch { toast.error("Could not save preferences"); }
    finally { setSaving(false); }
  };

  const toggleType = (t: string) =>
    setTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  return (
    <div className="relative rounded-3xl border border-border bg-gradient-to-br from-primary-soft to-accent-soft/50 p-6 md:p-8 mb-8">
      <button onClick={dismiss} aria-label="Dismiss" className="absolute top-4 right-4 h-8 w-8 rounded-full grid place-items-center bg-background/70 hover:bg-background">
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2 text-accent font-semibold text-sm">
        <Sparkles className="h-4 w-4" /> Personalize your search
      </div>
      <h2 className="mt-2 font-display text-2xl md:text-3xl font-bold">Tell us what you're looking for</h2>
      <p className="text-sm text-muted-foreground mt-1">We'll use these to recommend the right homes for you.</p>

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <div>
          <Label>Preferred county</Label>
          <Select value={county} onValueChange={setCounty}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{KENYA_COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Preferred estate</Label>
          <Input value={estate} onChange={(e) => setEstate(e.target.value)} placeholder="e.g. Kilimani" className="mt-1" />
        </div>
        <div>
          <Label>Min budget (KSh)</Label>
          <Input type="number" value={min_budget} onChange={(e) => setMin(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Max budget (KSh)</Label>
          <Input type="number" value={max_budget} onChange={(e) => setMax(e.target.value)} className="mt-1" />
        </div>
        <div className="md:col-span-2">
          <Label>House types</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {HOUSE_TYPES.map((t) => (
              <button key={t} type="button" onClick={() => toggleType(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  types.includes(t) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"
                }`}>{t}</button>
            ))}
          </div>
        </div>
        <div>
          <Label>Move-in date</Label>
          <Input type="date" value={move_in_date} onChange={(e) => setMove(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Furnished preference</Label>
          <Select value={furnished_preference} onValueChange={(v) => setFurn(v as never)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="furnished">Furnished</SelectItem>
              <SelectItem value="unfurnished">Unfurnished</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm mt-2">
          <Checkbox checked={needs_parking} onCheckedChange={(v) => setParking(!!v)} /> I need parking
        </label>
        <label className="flex items-center gap-2 text-sm mt-2">
          <Checkbox checked={has_pets} onCheckedChange={(v) => setPets(!!v)} /> I have pets
        </label>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={save} disabled={saving} className="rounded-full">
          {saving ? "Saving..." : "Save preferences"}
        </Button>
        <Button variant="ghost" onClick={dismiss} className="rounded-full">Skip for now</Button>
      </div>
    </div>
  );
}
