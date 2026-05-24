import { Heart, MapPin, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { Property } from "@/lib/properties";
import { formatKsh } from "@/lib/properties";

export function PropertyCard({ property }: { property: Property }) {
  const [saved, setSaved] = useState(false);

  return (
    <Link
      to="/property/$id"
      params={{ id: property.id }}
      className="group block bg-card rounded-2xl overflow-hidden border border-border shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={property.image}
          alt={property.name}
          loading="lazy"
          width={1024}
          height={768}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setSaved((s) => !s);
          }}
          aria-label="Save"
          className="absolute top-3 right-3 grid place-items-center h-9 w-9 rounded-full bg-background/90 backdrop-blur hover:scale-110 transition-transform"
        >
          <Heart
            className={`h-4 w-4 ${saved ? "fill-destructive text-destructive" : "text-foreground"}`}
          />
        </button>
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            property.available
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-muted-foreground"
          }`}>
            {property.available ? "Available" : "Occupied"}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-base leading-snug">
            {property.name}
          </h3>
          <span className="flex items-center gap-1 text-xs font-medium shrink-0">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            {property.rating}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {property.location}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md bg-primary-soft text-primary">
            {property.type}
          </span>
          <div className="text-right">
            <div className="text-base font-bold text-foreground">
              {formatKsh(property.price)}
            </div>
            <div className="text-[10px] text-muted-foreground -mt-0.5">/ month</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
