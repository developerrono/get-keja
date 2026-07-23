import { useState } from "react";
import { Button } from "@/components/ui/button";
import { moveIn, formatKsh } from "@/lib/keja-api";
import { toast } from "sonner";
import { Home, Loader2 } from "lucide-react";

/**
 * Drop this into your property detail page (or a unit row) so a tenant can
 * claim a vacant unit and create their own tenancy. Redirect them to the
 * rent/lease page afterwards so they can immediately pay via PayRentCard.
 */
export function MoveInButton({
  tenantId,
  propertyId,
  landlordId,
  monthlyRent,
  unitId,
  isVacant = true,
  onMovedIn,
}: {
  tenantId: string | undefined;
  propertyId: string;
  landlordId: string;
  monthlyRent: number;
  unitId?: string | null;
  isVacant?: boolean;
  onMovedIn?: (tenancyId: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleMoveIn = async () => {
    if (!tenantId) {
      toast.error("You need to be signed in as a tenant to move in.");
      return;
    }
    if (!window.confirm(`Move in to this ${unitId ? "unit" : "property"} at ${formatKsh(monthlyRent)}/month?`)) {
      return;
    }
    setLoading(true);
    try {
      const tenancyId = await moveIn({
        tenant_id: tenantId,
        property_id: propertyId,
        landlord_id: landlordId,
        monthly_rent: monthlyRent,
        unit_id: unitId,
      });
      toast.success("You've moved in! Head to your lease page to pay rent.");
      onMovedIn?.(tenancyId);
    } catch (err: any) {
      toast.error(err.message || "Could not complete move-in.");
    } finally {
      setLoading(false);
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
    <Button onClick={handleMoveIn} disabled={loading} className="rounded-full gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Home className="h-4 w-4" />}
      {loading ? "Moving in..." : "Move In"}
    </Button>
  );
}
