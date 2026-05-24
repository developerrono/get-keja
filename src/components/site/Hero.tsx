import hero from "@/assets/hero-apartments.jpg";
import { SearchBar } from "./SearchBar";
import { BadgeCheck, ShieldCheck, Zap } from "lucide-react";

export function Hero() {
  return (
    <section className="relative gradient-hero">
      <div className="container-page pt-12 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-[1.05fr_1fr] gap-10 items-center">
        <div className="animate-float-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Real-time availability across Kenya
          </span>
          <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            Find Your Next <span className="text-accent">Keja</span> Easily
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl">
            Search verified rental houses and apartments around you with
            real-time availability — from bedsitters to family homes.
          </p>

          <div className="mt-8">
            <SearchBar />
          </div>

          <div className="mt-7 flex flex-wrap gap-5 text-xs text-muted-foreground">
            <Trust icon={<ShieldCheck className="h-4 w-4 text-accent" />} label="Verified landlords" />
            <Trust icon={<Zap className="h-4 w-4 text-accent" />} label="Live availability" />
            <Trust icon={<BadgeCheck className="h-4 w-4 text-accent" />} label="No agent fees" />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 gradient-primary opacity-20 blur-3xl rounded-[3rem]" />
          <div className="relative rounded-[2rem] overflow-hidden border border-border shadow-card">
            <img
              src={hero}
              alt="Modern apartments"
              width={1600}
              height={1200}
              className="w-full h-full object-cover aspect-[4/5] lg:aspect-[5/6]"
            />
            <FloatingCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function Trust({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-medium">
      {icon}
      {label}
    </span>
  );
}

function FloatingCard() {
  return (
    <div className="absolute bottom-5 left-5 right-5 sm:right-auto sm:max-w-xs rounded-2xl bg-card/95 backdrop-blur border border-border shadow-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            Featured
          </div>
          <div className="font-display font-semibold mt-0.5">Westlands 2BR</div>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-accent text-accent-foreground">
          Available
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div className="text-xl font-bold">KSh 55,000<span className="text-xs font-medium text-muted-foreground">/mo</span></div>
        <div className="flex -space-x-2">
          {["A", "B", "C"].map((c) => (
            <div key={c} className="h-7 w-7 rounded-full gradient-primary border-2 border-card grid place-items-center text-[10px] font-bold text-primary-foreground">
              {c}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
