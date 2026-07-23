import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initiateStkPush, waitForMpesaResult, formatKsh } from "@/lib/keja-api";
import { Smartphone, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Drop this into a tenant's lease/rent page. Pass the tenancy details it's
 * paying against; tenancy_id/property_id/unit_id are optional but recommended
 * so the payment can be tied back to a specific lease and reduce its balance.
 */
export function PayRentCard({
  tenantId,
  landlordId,
  tenancyId,
  propertyId,
  unitId,
  suggestedAmount,
  defaultPhone,
}: {
  tenantId: string;
  landlordId: string;
  tenancyId?: string | null;
  propertyId?: string | null;
  unitId?: string | null;
  suggestedAmount?: number;
  defaultPhone?: string;
}) {
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [amount, setAmount] = useState(suggestedAmount ? String(suggestedAmount) : "");
  const [stage, setStage] = useState<"idle" | "sent" | "success" | "failed">("idle");
  const [resultMsg, setResultMsg] = useState("");

  const pay = async () => {
    const amt = Number(amount);
    if (!phone.trim()) return toast.error("Enter your M-Pesa phone number.");
    if (!amt || amt < 1) return toast.error("Enter an amount of at least KSh 1.");

    setStage("sent");
    setResultMsg("");
    try {
      const { checkoutRequestId } = await initiateStkPush({
        tenant_id: tenantId,
        landlord_id: landlordId,
        phone,
        amount: amt,
        tenancy_id: tenancyId,
        property_id: propertyId,
        unit_id: unitId,
      });
      toast.info("Check your phone and enter your M-Pesa PIN.");

      const result = await waitForMpesaResult(checkoutRequestId);
      if (result.status === "success") {
        setStage("success");
        setResultMsg(`Payment confirmed. Receipt: ${result.mpesa_receipt}`);
        toast.success("Payment successful!");
      } else {
        setStage("failed");
        setResultMsg(result.failure_reason || "Payment wasn't completed.");
      }
    } catch (err: any) {
      setStage("failed");
      setResultMsg(err.message || "Could not start the payment.");
    }
  };

  const reset = () => {
    setStage("idle");
    setResultMsg("");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Smartphone className="h-5 w-5 text-accent" />
        <h3 className="font-display font-bold text-lg">Pay rent with M-Pesa</h3>
      </div>

      {stage === "idle" || stage === "sent" ? (
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">M-Pesa phone number</Label>
            <Input
              className="mt-1.5"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XXXXXXXX"
              disabled={stage === "sent"}
            />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount (KSh)</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 2"
              disabled={stage === "sent"}
            />
          </div>
          <Button onClick={pay} disabled={stage === "sent"} className="w-full rounded-full">
            {stage === "sent" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Waiting for confirmation...
              </span>
            ) : (
              "Send STK Push"
            )}
          </Button>
          {stage === "sent" && (
            <p className="text-xs text-muted-foreground text-center">
              A prompt was sent to {phone}. Enter your M-Pesa PIN to complete the payment.
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          {stage === "success" ? (
            <CheckCircle2 className="h-10 w-10 mx-auto text-green-600" />
          ) : (
            <XCircle className="h-10 w-10 mx-auto text-destructive" />
          )}
          <p className="mt-3 text-sm font-semibold">{stage === "success" ? "Payment received" : "Payment failed"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{resultMsg}</p>
          <Button variant="outline" size="sm" onClick={reset} className="mt-4 rounded-full">
            Make another payment
          </Button>
        </div>
      )}
    </div>
  );
}
