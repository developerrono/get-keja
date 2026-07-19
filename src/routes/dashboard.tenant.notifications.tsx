import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listNotifications, markNotificationRead } from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/dashboard/tenant/notifications")({ component: Notifs });

function Notifs() {
  const { user } = useAuth();
  const [items, setItems] = useState<Awaited<ReturnType<typeof listNotifications>>>([]);
  useEffect(() => { if (user) listNotifications(user.id).then(setItems); }, [user]);

  const read = async (id: string) => { await markNotificationRead(id); setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n)); };

  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Notifications</h1>
      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">You're all caught up.</div>
      ) : (
        <ul className="mt-6 space-y-2">
          {items.map((n) => (
            <li key={n.id} onClick={() => !n.read && read(n.id)}
              className={`flex gap-3 p-4 rounded-2xl border border-border cursor-pointer ${n.read ? "bg-card" : "bg-primary-soft"}`}>
              <Bell className="h-4 w-4 mt-1 text-accent" />
              <div className="flex-1">
                <div className="font-semibold text-sm">{n.title}</div>
                {n.body && <div className="text-xs text-muted-foreground mt-1">{n.body}</div>}
                <div className="text-[11px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
