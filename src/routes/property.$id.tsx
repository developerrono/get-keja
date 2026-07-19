import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { PropertyCardDB } from "@/components/site/PropertyCardDB";
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
import {
  fetchPropertyById,
  fetchProperties,
  toggleFavorite,
  listFavorites,
  bookVisit,
  getOrCreateConversation,
  formatKsh,
  type DbProperty,
  type DbUnit,
} from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  Bath,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  Heart,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Square,
  Star,
  ShieldCheck,
} from "lucide-react";
import fallbackImg from "@/assets/property-1.jpg";

type Landlord = { id: string; full_name: string; email: string; phone: string | null; is_verified: boolean } | null;
type Review = { id: string; tenant_name: string; rating: number; body: string | null; created_at: string };
type FullProperty = DbProperty & { landlord: Landlord; units: DbUnit[]; reviews: Review[] };

export const Route = createFileRoute("/property/$id")({
  loader: async ({ params }) => {
    try {
      const { property, units, reviews, landlord } = await fetchPropertyById(params.id);
      return { property: { ...property, units, reviews, landlord } as FullProperty };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.property.name} — GetKeja` : "Property — GetKeja" },
      {
        name: "description",
        content: loaderData
          ? `${loaderData.property.house_type} in ${loaderData.property.estate ?? loaderData.property.county}. ${formatKsh(loaderData.property.monthly_rent)} / month.`
          : "Property details",
      },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Property not found</h1>
        <Link to="/dashboard/tenant/feed" className="text-accent underline mt-2 inline-block">
          Back to listings
        </Link>
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen grid place-items-center">
      <p>Something went wrong loading this property.</p>
    </div>
  ),
  component: PropertyPage,
});

function PropertyPage() {
  const { property } = Route.useLoaderData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [saved, setSaved] = useState(false);
  const [savingFav, setSavingFav] = useState(false);
  const [similar, setSimilar] = useState<DbProperty[]>([]);
  const [messaging, setMessaging] = useState(false);

  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [visitUnit, setVisitUnit] = useState<string>(property.units[0]?.id ?? "none");
  const [bookingVisit, setBookingVisit] = useState(false);

  const isOwnListing = user?.id === property.landlord_id;

  useEffect(() => {
    if (user) {
      listFavorites(user.id).then((favs) => setSaved(favs.some((f) => f.id === property.id)));
    }
  }, [user, property.id]);

  useEffect(() => {
    fetchProperties({ county: property.county, limit: 4 }).then((r) =>
      setSimilar(r.rows.filter((p) => p.id !== property.id).slice(0, 3)),
    );
  }, [property.id, property.county]);

  const gallery = useMemo(() => {
    const imgs = [property.cover_image, ...(property.images ?? [])].filter(Boolean) as string[];
    return imgs.length > 0 ? imgs : [fallbackImg];
  }, [property.cover_image, property.images]);

  const vacantUnits = property.units.filter((u) => u.is_vacant).length;
  const avgRating = Number(property.average_rating) || 0;

  const toggleSave = async () => {
    if (!user) { toast.error("Sign in to save properties"); return; }
    setSavingFav(true);
    try {
      const s = await toggleFavorite(user.id, property.id);
      setSaved(s);
      toast.success(s ? "Saved to favorites" : "Removed from favorites");
    } catch {
      toast.error("Could not update favorites");
    } finally {
      setSavingFav(false);
    }
  };

  const messageLandlord = async () => {
    if (!user) { toast.error("Sign in to message the landlord"); return; }
    setMessaging(true);
    try {
      await getOrCreateConversation(user.id, property.landlord_id, property.id);
      navigate({ to: "/dashboard/tenant/messages" as never });
    } catch {
      toast.error("Could not start a conversation");
    } finally {
      setMessaging(false);
    }
  };

  const submitVisit = async () => {
    if (!user) { toast.error("Sign in to schedule a visit"); return; }
    if (!visitDate || !visitTime) { toast.error("Pick a date and time"); return; }
    setBookingVisit(true);
    try {
      await bookVisit({
        tenant_id: user.id,
        property_id: property.id,
        unit_id: visitUnit !== "none" ? visitUnit : null,
        scheduled_at: `${visitDate}T${visitTime}:00`,
      });
      toast.success("Visit requested — the landlord will confirm soon.");
      setVisitDate("");
      setVisitTime("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not book a visit");
    } finally {
      setBookingVisit(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container-page py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md bg-accent-soft text-accent">
              {property.house_type}
            </span>
            <h1 className="mt-3 font-display text-3xl md:text-4xl font-bold">{property.name}</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {[property.estate, property.county].filter(Boolean).join(", ")}
              </span>
              {property.reviews_count > 0 && (
                <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-accent text-accent" />{avgRating.toFixed(1)} ({property.reviews_count} reviews)</span>
              )}
              <span className={`flex items-center gap-1 ${vacantUnits > 0 ? "text-accent" : ""}`}>
                <CheckCircle2 className="h-4 w-4" />
                {property.units.length === 0
                  ? "Availability not listed"
                  : vacantUnits > 0 ? `${vacantUnits} unit${vacantUnits > 1 ? "s" : ""} available` : "Fully occupied"}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-right">
              <div className="text-3xl font-display font-bold">{formatKsh(property.monthly_rent)}</div>
              <div className="text-xs text-muted-foreground">per month{property.units.length > 1 ? " (from)" : ""}</div>
            </div>
            <button
              onClick={toggleSave}
              disabled={savingFav}
              aria-label="Save"
              className="grid place-items-center h-11 w-11 rounded-full border border-border bg-card hover:scale-105 transition-transform shrink-0"
            >
              <Heart className={`h-5 w-5 ${saved ? "fill-destructive text-destructive" : "text-foreground"}`} />
            </button>
          </div>
        </div>

        <div className={`mt-6 grid gap-2 h-[420px] rounded-3xl overflow-hidden ${gallery.length > 1 ? "grid-cols-4 grid-rows-2" : "grid-cols-1"}`}>
          <img src={gallery[0]} alt="" loading="lazy" className={`h-full w-full object-cover ${gallery.length > 1 ? "col-span-2 row-span-2" : ""}`} />
          {gallery.slice(1, 5).map((src, i) => (
            <img key={i} src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
          ))}
        </div>

        <div className="mt-10 grid lg:grid-cols-[1fr_360px] gap-10">
          <div>
            {(property.bedrooms != null || property.bathrooms != null || property.area_sqm != null) && (
              <div className="grid grid-cols-3 gap-3">
                <Spec icon={BedDouble} label="Bedrooms" value={property.bedrooms ?? "—"} />
                <Spec icon={Bath} label="Bathrooms" value={property.bathrooms ?? "—"} />
                <Spec icon={Square} label="Area" value={property.area_sqm ? `${property.area_sqm} m²` : "—"} />
              </div>
            )}

            {property.description && (
              <section className="mt-10">
                <h2 className="font-display text-xl font-bold">About this place</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed whitespace-pre-line">{property.description}</p>
              </section>
            )}

            {property.units.length > 0 && (
              <section className="mt-10">
                <h2 className="font-display text-xl font-bold">Units</h2>
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  {property.units.map((u) => (
                    <div key={u.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">Unit {u.label}</div>
                        <div className="text-xs text-muted-foreground">{formatKsh(u.monthly_rent)} / mo</div>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${u.is_vacant ? "bg-accent-soft text-accent" : "bg-muted text-muted-foreground"}`}>
                        {u.is_vacant ? "Vacant" : "Occupied"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {property.amenities.length > 0 && (
              <section className="mt-10">
                <h2 className="font-display text-xl font-bold">Amenities</h2>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                      {a}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-10">
              <h2 className="font-display text-xl font-bold">Location</h2>
              <div className="mt-4 rounded-2xl border border-border h-64 grid place-items-center bg-surface text-muted-foreground text-sm">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {property.address || [property.estate, property.county].filter(Boolean).join(", ") || "Location not specified"}
                </span>
              </div>
            </section>

            <section className="mt-10">
              <h2 className="font-display text-xl font-bold">Reviews</h2>
              {property.reviews.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No reviews yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {property.reviews.map((r) => (
                    <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm">{r.tenant_name}</div>
                        <div className="flex text-accent">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : ""}`} />
                          ))}
                        </div>
                      </div>
                      {r.body && <p className="text-sm text-muted-foreground mt-2">{r.body}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-20 h-fit space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold shrink-0">
                  {(property.landlord?.full_name ?? "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold flex items-center gap-1 truncate">
                    {property.landlord?.full_name ?? "Landlord"}
                    {property.landlord?.is_verified && <ShieldCheck className="h-4 w-4 text-accent shrink-0" />}
                  </div>
                  <div className="text-xs text-muted-foreground">{property.landlord?.is_verified ? "Verified landlord" : "Landlord"}</div>
                </div>
              </div>

              {(property.landlord?.phone || property.landlord?.email) && (
                <div className="mt-4 space-y-1.5 text-sm">
                  {property.landlord?.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {property.landlord.phone}</div>
                  )}
                  {property.landlord?.email && (
                    <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {property.landlord.email}</div>
                  )}
                </div>
              )}

              {!isOwnListing && (
                <div className="mt-5 space-y-2">
                  <Button variant="outline" className="w-full rounded-full gap-2" onClick={messageLandlord} disabled={messaging}>
                    {messaging ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                    Message landlord
                  </Button>
                </div>
              )}
            </div>

            {!isOwnListing && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="font-semibold text-sm flex items-center gap-2"><CalendarCheck className="h-4 w-4" /> Schedule a visit</div>
                {property.units.length > 1 && (
                  <div>
                    <Label className="text-xs">Unit (optional)</Label>
                    <Select value={visitUnit} onValueChange={setVisitUnit}>
                      <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Any / not sure</SelectItem>
                        {property.units.map((u) => <SelectItem key={u.id} value={u.id}>Unit {u.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Date</Label>
                    <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="mt-1 h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">Time</Label>
                    <Input type="time" value={visitTime} onChange={(e) => setVisitTime(e.target.value)} className="mt-1 h-9" />
                  </div>
                </div>
                <Button className="w-full rounded-full gap-2" onClick={submitVisit} disabled={bookingVisit}>
                  {bookingVisit ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                  Request visit
                </Button>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-primary-soft p-5 text-sm">
              <div className="font-semibold">
                {property.units.length === 0 ? "Contact landlord for availability" : vacantUnits > 0 ? `${vacantUnits} unit${vacantUnits > 1 ? "s" : ""} available` : "Currently full"}
              </div>
              <p className="text-muted-foreground mt-1">
                {vacantUnits > 0 ? "Book quickly — units like this go fast." : "Message the landlord to be notified when a unit opens up."}
              </p>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold">Similar homes</h2>
            <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {similar.map((p) => <PropertyCardDB key={p.id} property={p} />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Spec({ icon: Icon, label, value }: { icon: typeof BedDouble; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
      <span className="grid place-items-center h-10 w-10 rounded-xl bg-primary-soft text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}