import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { initiateStkPush, waitForMpesaResult, moveIn, formatKsh } from "@/lib/keja-api";
import { normalizeKenyanPhone, isValidKenyanPhone } from "@/lib/validators";
import { toast } from "sonner";
import { Home, Loader2, Smartphone, CheckCircle2, XCircle } from "lucide-react";

/**
 * Drop this into your property detail page (or a unit row) so a tenant can
 * claim a vacant unit. Payment happens FIRST: this opens an M-Pesa STK Push
 * dialog, waits for confirmed payment, and only then creates the tenancy
 * (moveIn()) using the confirmed transaction's checkout_request_id. The
 * backend independently re-verifies the payment, so this can't be skipped.
 */
export function MoveInButton({
  tenantId,
  propertyId,
  landlordId,
  monthlyRent,
  unitId,
  isVacant = true,
  defaultPhone,
  onMovedIn,
}: {
  tenantId: string | undefined;
  propertyId: string;
  landlordId: string;
  monthlyRent: number;
  unitId?: string | null;
  isVacant?: boolean;
  defaultPhone?: string;
  onMovedIn?: (tenancyId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [stage, setStage] = useState<"idle" | "paying" | "paid" | "failed" | "finalizing">("idle");
  const [resultMsg, setResultMsg] = useState("");

  const startFlow = () => {
    if (!tenantId) {
      toast.error("You need to be signed in as a tenant to move in.");
      return;
    }
    setOpen(true);
    setStage("idle");
    setResultMsg("");
  };

  const pay = async () => {
    if (!tenantId) return;
    if (!isValidKenyanPhone(phone)) {
      toast.error("Enter a valid M-Pesa phone number, e.g. 07XXXXXXXX.");
      return;
    }

    setStage("paying");
    setResultMsg("");
    try {
      const { checkoutRequestId } = await initiateStkPush({
        tenant_id: tenantId,
        landlord_id: landlordId,
        phone: normalizeKenyanPhone(phone),
        amount: monthlyRent,
        property_id: propertyId,
        unit_id: unitId,
      });
      toast.info("Check your phone and enter your M-Pesa PIN to pay first month's rent.");

      const result = await waitForMpesaResult(checkoutRequestId);
      if (result.status !== "success") {
        setStage("failed");
        setResultMsg(result.failure_reason || "Payment wasn't completed.");
        return;
      }

      // Payment confirmed — now, and only now, create the tenancy.
      setStage("finalizing");
      const tenancyId = await moveIn({
        tenant_id: tenantId,
        property_id: propertyId,
        landlord_id: landlordId,
        monthly_rent: monthlyRent,
        unit_id: unitId,
        checkout_request_id: checkoutRequestId,
      });

      setStage("paid");
      setResultMsg("Payment confirmed and you're moved in!");
      toast.success("You've moved in! Head to your lease page for details.");
      onMovedIn?.(tenancyId);
    } catch (err: any) {
      setStage("failed");
      setResultMsg(err.message || "Something went wrong completing your move-in.");
    }
  };

  if (!isVacant) {
    return (
      <Button disabled variant="outline" className="rounded-full">
        Not available
      </Button>
    );
  }

  return (
    <>
      <Button onClick={startFlow} className="rounded-full gap-2">
        <Home className="h-4 w-4" />
        Move In
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (stage !== "paying" && stage !== "finalizing") setOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-accent" />
              Pay to move in
            </DialogTitle>
          </DialogHeader>

          {(stage === "idle" || stage === "paying") && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Moving into this {unitId ? "unit" : "property"} requires paying the first
                month's rent — <strong>{formatKsh(monthlyRent)}</strong> — via M-Pesa before
                your tenancy is created.
              </p>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  M-Pesa phone number
                </Label>
                <Input
                  className="mt-1.5"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  disabled={stage === "paying"}
                />
              </div>
              <Button onClick={pay} disabled={stage === "paying"} className="w-full rounded-full">
                {stage === "paying" ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Waiting for confirmation...
                  </span>
                ) : (
                  `Pay ${formatKsh(monthlyRent)} & Move In`
                )}
              </Button>
              {stage === "paying" && (
                <p className="text-xs text-muted-foreground text-center">
                  A prompt was sent to {phone}. Enter your M-Pesa PIN to complete the payment.
                </p>
              )}
            </div>
          )}

          {stage === "finalizing" && (
            <div className="text-center py-6">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-accent" />
              <p className="mt-3 text-sm font-semibold">Payment received — setting up your tenancy…</p>
            </div>
          )}

          {(stage === "paid" || stage === "failed") && (
            <div className="text-center py-4">
              {stage === "paid" ? (
                <CheckCircle2 className="h-10 w-10 mx-auto text-green-600" />
              ) : (
                <XCircle className="h-10 w-10 mx-auto text-destructive" />
              )}
              <p className="mt-3 text-sm font-semibold">
                {stage === "paid" ? "You've moved in" : "Move-in didn't complete"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{resultMsg}</p>
              {stage === "failed" && (
                <Button variant="outline" size="sm" onClick={() => setStage("idle")} className="mt-4 rounded-full">
                  Try again
                </Button>
              )}
              {stage === "paid" && (
                <Button size="sm" onClick={() => setOpen(false)} className="mt-4 rounded-full">
                  Done
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
