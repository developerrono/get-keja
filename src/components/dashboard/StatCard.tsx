import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground font-medium">{label}</div>
          <div className="mt-2 text-2xl font-display font-bold">{value}</div>
          {delta && <div className="mt-1 text-xs text-accent font-semibold">{delta}</div>}
        </div>
        <span className="grid place-items-center h-10 w-10 rounded-xl bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
