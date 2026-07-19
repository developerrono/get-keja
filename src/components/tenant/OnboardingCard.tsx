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
  const [budgetMin, setBudgetMin] = useState("10000");
  const [budgetMax, setBudgetMax] = useState("50000");
  const [houseTypes, setHouseTypes] = useState<string[]>([]);
  const [moveInDate, setMoveInDate] = useState("");
  const [needsParking, setNeedsParking] = useState(false);
  const [hasPets, setHasPets] = useState(false);
  const [furnishedPreference, setFurnishedPreference] = useState<"any" | "furnished" | "unfurnished">("any");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchTenantPrefs(user.id).then((p) => {
      setPrefs(p);
      if (p) {
        setCounty(p.preferred_counties?.[0] ?? "Nairobi");
        setEstate(p.preferred_estates?.[0] ?? "");
        setBudgetMin(String(p.budget_min ?? 10000));
        setBudgetMax(String(p.budget_max ?? 50000));
        setHouseTypes(p.preferred_house_types ?? []);
        setMoveInDate(p.move_in_date ?? "");
        setNeedsParking(p.needs_parking);
        setHasPets(p.has_pets);
        setFurnishedPreference(p.furnished_preference ?? "any");
      }
      setLoading(false);
    });
  }, [user]);

  if (loading || !user) return null;
  if (prefs?.onboarding_dismissed || prefs?.onboarding_completed) return null;

  const dismiss = async () => {
    if (!user) return;
    await upsertTenantPrefs(user.id, { onboarding_dismissed: true });
    setPrefs({ ...(prefs ?? ({} as DbTenantPrefs)), onboarding_dismissed: true });
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await upsertTenantPrefs(user.id, {
        preferred_counties: [county],
        preferred_estates: estate ? [estate] : [],
        budget_min: Number(budgetMin) || null,
        budget_max: Number(budgetMax) || null,
        preferred_house_types: houseTypes,
        move_in_date: moveInDate || null,
        needs_parking: needsParking,
        has_pets: hasPets,
        furnished_preference: furnishedPreference,
        onboarding_completed: true,
      });
      toast.success("Preferences saved — we'll tailor your feed");
      setPrefs({ ...(prefs ?? ({} as DbTenantPrefs)), onboarding_completed: true });
    } catch {
      toast.error("Could not save preferences");
    } finally {
      setSaving(false);
    }
  };

  const toggleType = (t: string) =>
    setHouseTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

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
          <Input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Max budget (KSh)</Label>
          <Input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} className="mt-1" />
        </div>
        <div className="md:col-span-2">
          <Label>House types</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {HOUSE_TYPES.map((t) => (
              <button key={t} type="button" onClick={() => toggleType(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  houseTypes.includes(t) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"
                }`}>{t}</button>
            ))}
          </div>
        </div>
        <div>
          <Label>Move-in date</Label>
          <Input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Furnished preference</Label>
          <Select value={furnishedPreference} onValueChange={(v) => setFurnishedPreference(v as typeof furnishedPreference)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="furnished">Furnished</SelectItem>
              <SelectItem value="unfurnished">Unfurnished</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm mt-2">
          <Checkbox checked={needsParking} onCheckedChange={(v) => setNeedsParking(!!v)} /> I need parking
        </label>
        <label className="flex items-center gap-2 text-sm mt-2">
          <Checkbox checked={hasPets} onCheckedChange={(v) => setHasPets(!!v)} /> I have pets
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