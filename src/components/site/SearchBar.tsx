import { Search, MapPin, Home, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchBar() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="bg-card border border-border rounded-2xl p-2 shadow-card grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_auto] gap-2"
    >
      <Field icon={<MapPin className="h-4 w-4" />} label="Location" placeholder="Nairobi, Kilimani..." />
      <Field icon={<DollarSign className="h-4 w-4" />} label="Price range" placeholder="KSh 10k – 60k" />
      <Field icon={<Home className="h-4 w-4" />} label="House type" placeholder="Any type" />
      <Button size="lg" className="rounded-xl h-full px-6 gap-2">
        <Search className="h-4 w-4" />
        Search
      </Button>
    </form>
  );
}

function Field({
  icon,
  label,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
}) {
  return (
    <label className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/60 transition-colors cursor-text">
      <span className="text-accent">{icon}</span>
      <span className="flex flex-col text-left min-w-0">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </span>
        <input
          className="bg-transparent outline-none text-sm font-medium placeholder:text-muted-foreground/70 w-full"
          placeholder={placeholder}
        />
      </span>
    </label>
  );
}
