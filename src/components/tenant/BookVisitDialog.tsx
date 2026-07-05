import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { bookVisit, type DbUnit } from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";

export function BookVisitDialog({
  open, onOpenChange, propertyId, units,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; propertyId: string; units: DbUnit[];
}) {
  const { user } = useAuth();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [unitId, setUnitId] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) return toast.error("Sign in to book a visit");
    if (!date) return toast.error("Choose a date");
    setSaving(true);
    try {
      await bookVisit({
        tenant_id: user.id, property_id: propertyId,
        unit_id: unitId ?? null,
        scheduled_at: new Date(`${date}T${time}`).toISOString(),
        notes,
      });
      toast.success("Visit requested — landlord will confirm shortly");
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Could not book visit");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Schedule a visit</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {units.length > 0 && (
            <div>
              <Label>Unit</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Any available" /></SelectTrigger>
                <SelectContent>
                  {units.filter((u) => u.is_vacant).map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" /></div>
            <div><Label>Time</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1" /></div>
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything the landlord should know" className="mt-1" />
          </div>
          <Button onClick={submit} disabled={saving} className="w-full rounded-full">{saving ? "Booking..." : "Confirm visit"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
