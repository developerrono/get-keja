import { Heart, MapPin, Share2, ShieldCheck, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { formatKsh, toggleFavorite, type DbProperty } from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";
import fallback from "@/assets/property-1.jpg";

export function PropertyCardDB({
  property,
  initialSaved = false,
  landlordVerified = false,
  vacantUnits,
  distanceKm,
  view = "grid",
}: {
  property: DbProperty;
  initialSaved?: boolean;
  landlordVerified?: boolean;
  vacantUnits?: number;
  distanceKm?: number;
  view?: "grid" | "list";
}) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Sign in to save properties");
    if (busy) return;
    setBusy(true);
    try {
      const s = await toggleFavorite(user.id, property.id);
      setSaved(s);
      toast.success(s ? "Saved to favorites" : "Removed from favorites");
    } catch {
      toast.error("Could not update favorites");
    } finally { setBusy(false); }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/property/${property.id}`;
    try {
      if (navigator.share) await navigator.share({ title: property.name, url });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    } catch { /* cancelled */ }
  };

  const image = property.cover_image || property.images?.[0] || fallback;
  const location = [property.estate, property.county].filter(Boolean).join(", ");

  if (view === "list") {
    return (
      <Link
        to="/property/$id" params={{ id: property.id }}
        className="group flex bg-card rounded-2xl overflow-hidden border border-border shadow-soft hover:shadow-card transition-all"
      >
        <div className="relative w-52 shrink-0 aspect-[4/3] bg-muted">
          <img src={image} alt={property.name} className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-display font-semibold truncate">{property.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" /> {location || "—"}
                {distanceKm != null && <span>· {distanceKm.toFixed(1)} km</span>}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="font-bold">{formatKsh(property.monthly_rent)}</div>
              <div className="text-[10px] text-muted-foreground">/ mo</div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 items-center text-xs">
            <Badge>{property.house_type}</Badge>
            {landlordVerified && <span className="inline-flex items-center gap-1 text-accent"><ShieldCheck className="h-3 w-3" />Verified</span>}
            <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-accent text-accent" />{Number(property.average_rating).toFixed(1)}</span>
            {vacantUnits != null && <span className="text-muted-foreground">· {vacantUnits} units</span>}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleSave} className="h-8 w-8 grid place-items-center rounded-full border border-border hover:bg-muted"><Heart className={`h-3.5 w-3.5 ${saved ? "fill-destructive text-destructive" : ""}`} /></button>
            <button onClick={handleShare} className="h-8 w-8 grid place-items-center rounded-full border border-border hover:bg-muted"><Share2 className="h-3.5 w-3.5" /></button>
            <span className="ml-auto text-xs font-semibold text-accent group-hover:underline">View details →</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/property/$id" params={{ id: property.id }}
      className="group block bg-card rounded-2xl overflow-hidden border border-border shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={image} alt={property.name} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button onClick={handleSave} aria-label="Save" className="grid place-items-center h-9 w-9 rounded-full bg-background/90 backdrop-blur hover:scale-110 transition-transform">
            <Heart className={`h-4 w-4 ${saved ? "fill-destructive text-destructive" : "text-foreground"}`} />
          </button>
          <button onClick={handleShare} aria-label="Share" className="grid place-items-center h-9 w-9 rounded-full bg-background/90 backdrop-blur hover:scale-110 transition-transform">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
        <div className="absolute top-3 left-3 flex gap-2">
          {landlordVerified && (
            <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-accent text-accent-foreground inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
          )}
          {vacantUnits != null && vacantUnits > 0 && (
            <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-background/90">{vacantUnits} units</span>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-base leading-snug truncate">{property.name}</h3>
          <span className="flex items-center gap-1 text-xs font-medium shrink-0">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            {Number(property.average_rating).toFixed(1)}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {location || "—"}
          {distanceKm != null && <span>· {distanceKm.toFixed(1)} km</span>}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <Badge>{property.house_type}</Badge>
          <div className="text-right">
            <div className="text-base font-bold">{formatKsh(property.monthly_rent)}</div>
            <div className="text-[10px] text-muted-foreground -mt-0.5">/ month</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md bg-primary-soft text-primary">
      {children}
    </span>
  );
}
