import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { createProperty, type CreatePropertyUnit } from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Trash2, MapPin, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/landlord/add-property")({
  head: () => ({ meta: [{ title: "Add Property — Landlord" }] }),
  component: AddPropertyPage,
});

function AddPropertyPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [county, setCounty] = useState("");
  const [town, setTown] = useState("");
  const [estate, setEstate] = useState("");
  const [street, setStreet] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState("");
  const [galleryText, setGalleryText] = useState("");
  const [units, setUnits] = useState<Unit[]>([
    { id: crypto.randomUUID(), unitNumber: "A1", houseType: "Bedsitter", rent: 8000, deposit: 8000, serviceCharge: 500, status: "vacant" },
  ]);
  const [submitting, setSubmitting] = useState(false);

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

  const galleryPreview = galleryText.split("\n").map((s) => s.trim()).filter(Boolean);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) {
      toast.error("You must be signed in.");
      return;
    }
    if (!name || !county || units.length === 0) {
      toast.error("Property name, county, and at least one unit are required.");
      return;
    }

    setSubmitting(true);
    try {
      const submittedUnits: CreatePropertyUnit[] = units.map((u) => ({
        label: u.unitNumber,
        house_type: u.houseType,
        rent: u.rent,
        status: u.status,
      }));

      await createProperty({
        landlord_id: profile.id,
        name,
        description,
        county,
        estate: [town, estate].filter(Boolean).join(" - ") || estate,
        address: street,
        amenities,
        cover_image: coverImage.trim() || null,
        images: galleryPreview,
        units: submittedUnits,
      });

      toast.success("Listing submitted for review!");
      navigate({ to: "/dashboard/landlord/properties" });
    } catch (err: any) {
      toast.error(err.message || "Could not create listing.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Add a new property</h1>
        <p className="text-sm text-muted-foreground mt-1">Fill in the details below to publish your listing.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Note: direct file upload and GPS pin aren't wired up yet — paste image URLs below in the meantime. New listings are reviewed before going live.
        </p>
      </header>

      <Section title="Basic information" description="Give tenants an accurate summary.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Property name">
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Green Heights" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the property, neighbourhood, and highlights…" />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Photos" description="Add a cover photo and any additional gallery photos, one URL per line.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Cover photo URL">
            <Input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://example.com/photo.jpg" />
          </Field>
          <Field label="Gallery photo URLs (one per line)">
            <Textarea
              rows={4}
              value={galleryText}
              onChange={(e) => setGalleryText(e.target.value)}
              placeholder={"https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg"}
            />
          </Field>
        </div>
        {(coverImage || galleryPreview.length > 0) && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
            {[coverImage, ...galleryPreview].filter(Boolean).map((url, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-surface border border-border">
                <img
                  src={url}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            ))}
          </div>
        )}
        {!coverImage && galleryPreview.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <ImageIcon className="h-4 w-4" /> No photos added yet — the listing will show a placeholder image.
          </div>
        )}
      </Section>

      <Section title="Location" description="Where can tenants find this property?">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="County"><Input required value={county} onChange={(e) => setCounty(e.target.value)} placeholder="e.g. Nairobi" /></Field>
          <Field label="Town"><Input value={town} onChange={(e) => setTown(e.target.value)} placeholder="e.g. Nairobi" /></Field>
          <Field label="Estate"><Input value={estate} onChange={(e) => setEstate(e.target.value)} placeholder="e.g. Kilimani" /></Field>
          <Field label="Street"><Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="e.g. Rose Avenue" /></Field>
        </div>
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface aspect-[16/8] grid place-items-center text-center px-6">
          <div>
            <MapPin className="h-8 w-8 mx-auto text-primary" />
            <p className="mt-2 text-sm font-semibold">Drop a pin on the map</p>
            <p className="text-xs text-muted-foreground">Interactive Google Map placeholder — connect Google Maps to enable.</p>
          </div>
        </div>
      </Section>

      <Section title="Units management" description="Add and manage individual units within this property.">
        <div className="space-y-3">
          {units.map((u) => (
            <div key={u.id} className="grid gap-3 md:grid-cols-[1fr_1.4fr_1fr_1fr_1fr_auto] items-end p-4 rounded-2xl border border-border bg-surface">
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

      <div className="flex flex-wrap gap-3 justify-end sticky bottom-4 bg-background/80 backdrop-blur p-3 rounded-2xl border border-border">
        <Button type="submit" className="rounded-full" disabled={submitting}>
          {submitting ? "Publishing..." : "Publish property"}
        </Button>
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