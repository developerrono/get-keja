import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AMENITIES, HOUSE_TYPES, type Unit, type HouseType } from "@/lib/landlord-data";
import { Plus, Trash2, MapPin, Upload, ImageIcon, Video, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/landlord/add-property")({
  head: () => ({ meta: [{ title: "Add Property — Landlord" }] }),
  component: AddPropertyPage,
});

function AddPropertyPage() {
  const [units, setUnits] = useState<Unit[]>([
    { id: crypto.randomUUID(), unitNumber: "A1", houseType: "Bedsitter", rent: 8000, deposit: 8000, serviceCharge: 500, status: "vacant" },
  ]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(false);
  const [status, setStatus] = useState<"vacant" | "occupied">("vacant");
  const [cover, setCover] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [videoName, setVideoName] = useState<string>("");

  const addUnit = () =>
    setUnits((u) => [
      ...u,
      { id: crypto.randomUUID(), unitNumber: "", houseType: "Bedsitter", rent: 0, deposit: 0, serviceCharge: 0, status: "vacant" },
    ]);
  const removeUnit = (id: string) => setUnits((u) => u.filter((x) => x.id !== id));
  const updateUnit = (id: string, patch: Partial<Unit>) =>
    setUnits((u) => u.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const toggleAmenity = (a: string) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const onCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setCover(URL.createObjectURL(f));
  };
  const onGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setGallery((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Property saved (demo)", { description: "Connect to backend to persist." });
  };

  return (
    <form onSubmit={submit} className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Add a new property</h1>
        <p className="text-sm text-muted-foreground mt-1">Fill in the details below to publish your listing.</p>
      </header>

      {/* Basic */}
      <Section title="Basic information" description="Give tenants an accurate summary.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Property name"><Input required placeholder="e.g. Green Heights" /></Field>
          <Field label="Property type">
            <Select defaultValue="Apartment">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {HOUSE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea rows={4} placeholder="Describe the property, neighbourhood, and highlights…" />
            </Field>
          </div>
        </div>
      </Section>

      {/* Location */}
      <Section title="Location" description="Where can tenants find this property?">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="County"><Input required placeholder="e.g. Nairobi" /></Field>
          <Field label="Town"><Input required placeholder="e.g. Nairobi" /></Field>
          <Field label="Estate"><Input required placeholder="e.g. Kilimani" /></Field>
          <Field label="Street"><Input placeholder="e.g. Rose Avenue" /></Field>
          <Field label="Building name"><Input placeholder="e.g. Green Heights Block A" /></Field>
          <Field label="GPS coordinates"><Input placeholder="-1.2921, 36.8219" /></Field>
        </div>
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface aspect-[16/8] grid place-items-center text-center px-6">
          <div>
            <MapPin className="h-8 w-8 mx-auto text-primary" />
            <p className="mt-2 text-sm font-semibold">Drop a pin on the map</p>
            <p className="text-xs text-muted-foreground">Interactive Google Map placeholder — connect Google Maps to enable.</p>
          </div>
        </div>
      </Section>

      {/* Units */}
      <Section title="Units management" description="Add and manage individual units within this property.">
        <div className="space-y-3">
          {units.map((u) => (
            <div key={u.id} className="grid gap-3 md:grid-cols-[1fr_1.4fr_1fr_1fr_1fr_1fr_auto] items-end p-4 rounded-2xl border border-border bg-surface">
              <Field label="Unit #">
                <Input value={u.unitNumber} onChange={(e) => updateUnit(u.id, { unitNumber: e.target.value })} placeholder="A1" />
              </Field>
              <Field label="House type">
                <Select value={u.houseType} onValueChange={(v) => updateUnit(u.id, { houseType: v as HouseType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HOUSE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Rent"><Input type="number" value={u.rent} onChange={(e) => updateUnit(u.id, { rent: +e.target.value })} /></Field>
              <Field label="Deposit"><Input type="number" value={u.deposit} onChange={(e) => updateUnit(u.id, { deposit: +e.target.value })} /></Field>
              <Field label="Service"><Input type="number" value={u.serviceCharge} onChange={(e) => updateUnit(u.id, { serviceCharge: +e.target.value })} /></Field>
              <Field label="Status">
                <Select value={u.status} onValueChange={(v) => updateUnit(u.id, { status: v as "vacant" | "occupied" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeUnit(u.id)} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addUnit} className="gap-2 rounded-full">
            <Plus className="h-4 w-4" /> Add unit
          </Button>
        </div>
      </Section>

      {/* Amenities */}
      <Section title="Amenities" description="Select all that apply.">
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => {
            const active = amenities.includes(a);
            return (
              <button
                type="button"
                key={a}
                onClick={() => toggleAmenity(a)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                {a}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Media */}
      <Section title="Media upload" description="Cover photo, gallery, video and virtual tour.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="rounded-2xl border-2 border-dashed border-border bg-surface p-6 grid place-items-center text-center cursor-pointer hover:border-primary transition">
            <input type="file" accept="image/*" hidden onChange={onCover} />
            {cover ? (
              <img src={cover} alt="cover" className="h-40 w-full object-cover rounded-xl" />
            ) : (
              <div>
                <ImageIcon className="h-8 w-8 mx-auto text-primary" />
                <p className="mt-2 text-sm font-semibold">Upload cover photo</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
              </div>
            )}
          </label>
          <label className="rounded-2xl border-2 border-dashed border-border bg-surface p-6 grid place-items-center text-center cursor-pointer hover:border-primary transition">
            <input type="file" accept="image/*" multiple hidden onChange={onGallery} />
            <div>
              <Upload className="h-8 w-8 mx-auto text-primary" />
              <p className="mt-2 text-sm font-semibold">Upload gallery images</p>
              <p className="text-xs text-muted-foreground">Select multiple files</p>
            </div>
          </label>
        </div>
        {gallery.length > 0 && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
            {gallery.map((g, i) => (
              <img key={i} src={g} alt="" className="aspect-square object-cover rounded-lg" />
            ))}
          </div>
        )}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 cursor-pointer">
            <Video className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">Property video</div>
              <div className="text-xs text-muted-foreground truncate">{videoName || "MP4, MOV up to 50MB"}</div>
            </div>
            <input type="file" accept="video/*" hidden onChange={(e) => setVideoName(e.target.files?.[0]?.name || "")} />
          </label>
          <Field label="Virtual tour URL">
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="https://…" />
            </div>
          </Field>
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contact information" description="Who should tenants reach out to?">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Contact person"><Input placeholder="Full name" /></Field>
          <Field label="Phone number"><Input placeholder="+254 7xx xxx xxx" /></Field>
          <Field label="WhatsApp number"><Input placeholder="+254 7xx xxx xxx" /></Field>
          <Field label="Email"><Input type="email" placeholder="you@example.com" /></Field>
        </div>
      </Section>

      {/* Pricing */}
      <Section title="Pricing" description="Set the default pricing for this property.">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Monthly rent"><Input type="number" placeholder="0" /></Field>
          <Field label="Deposit"><Input type="number" placeholder="0" /></Field>
          <Field label="Service charge"><Input type="number" placeholder="0" /></Field>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={utilitiesIncluded} onChange={(e) => setUtilitiesIncluded(e.target.checked)} className="h-4 w-4 rounded" />
          Utilities included (water, electricity)
        </label>
      </Section>

      {/* Availability */}
      <Section title="Availability" description="Toggle the overall status of this property.">
        <div className="flex gap-2">
          {(["vacant", "occupied"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-colors ${
                status === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Section>

      <div className="flex flex-wrap gap-3 justify-end sticky bottom-4 bg-background/80 backdrop-blur p-3 rounded-2xl border border-border">
        <Button type="button" variant="outline">Save as draft</Button>
        <Button type="submit" className="rounded-full">Publish property</Button>
      </div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4">
        <h2 className="font-display font-bold text-lg">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
