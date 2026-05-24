import { UserPlus, Search, CalendarCheck, KeyRound } from "lucide-react";
import { SectionHeader } from "./Categories";

const steps = [
  { icon: UserPlus, title: "Create account", desc: "Sign up free in seconds — email or Google." },
  { icon: Search, title: "Browse houses", desc: "Filter by price, location and amenities." },
  { icon: CalendarCheck, title: "Book a visit", desc: "Schedule a tour with verified landlords." },
  { icon: KeyRound, title: "Move in", desc: "Get the keys to your next Keja. Welcome home." },
];

export function HowItWorks() {
  return (
    <section className="container-page mt-24">
      <SectionHeader
        eyebrow="How it works"
        title="From search to keys — in 4 steps"
      />
      <div className="mt-10 grid md:grid-cols-4 gap-4">
        {steps.map((s, i) => (
          <div key={s.title} className="relative rounded-2xl border border-border bg-card p-6">
            <div className="absolute -top-3 -left-3 grid place-items-center h-8 w-8 rounded-full gradient-primary text-primary-foreground text-xs font-bold shadow-glow">
              {i + 1}
            </div>
            <div className="grid place-items-center h-11 w-11 rounded-xl bg-primary-soft text-primary">
              <s.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
