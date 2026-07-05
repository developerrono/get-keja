import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { submitReport } from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";

const CATS = [
  { v: "fake_listing", l: "Fake listing" },
  { v: "scam", l: "Scam" },
  { v: "spam", l: "Spam" },
  { v: "incorrect_info", l: "Incorrect information" },
  { v: "abuse", l: "Abuse" },
  { v: "other", l: "Other" },
];

export function ReportDialog({
  open, onOpenChange, targetType, targetId,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  targetType: "property" | "user" | "review"; targetId: string;
}) {
  const { user } = useAuth();
  const [category, setCategory] = useState("fake_listing");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) return toast.error("Sign in to report");
    setSaving(true);
    try {
      await submitReport({ reporter_id: user.id, target_type: targetType, target_id: targetId, category, description: desc });
      toast.success("Report submitted");
      onOpenChange(false);
    } catch { toast.error("Could not submit report"); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Report this listing</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Reason</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{CATS.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Details (optional)</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="mt-1" />
          </div>
          <Button onClick={submit} disabled={saving} className="w-full rounded-full">{saving ? "Submitting..." : "Submit report"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
