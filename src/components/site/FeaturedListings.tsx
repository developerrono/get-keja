import { Link } from "@tanstack/react-router";
import { properties } from "@/lib/properties";
import { PropertyCard } from "./PropertyCard";
import { SectionHeader } from "./Categories";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function FeaturedListings() {
  return (
    <section className="container-page mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader
          eyebrow="Featured"
          title="Hand-picked listings"
          subtitle="Verified, available, and ready for a visit."
        />
        <Link to="/listings">
          <Button variant="outline" className="rounded-full gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {properties.slice(0, 6).map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </section>
  );
}
