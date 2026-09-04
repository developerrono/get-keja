Two small additions to `keja-api.ts` — not a full rewrite, just paste these in.

## 1. Extend `DbProperty` (admin's list_properties now joins landlord info)

Add these two optional fields to the existing `DbProperty` type:

```ts
export type DbProperty = {
  // ...all existing fields stay as-is...
  units_count?: number;
  vacant_count?: number;
  occupied_count?: number;
  rent_min?: number | null;
  rent_max?: number | null;
  // NEW — only present on adminListProperties() results
  landlord_name?: string;
  landlord_email?: string;
};
```

## 2. Add approve/reject helpers + status filter, near `adminUpdateProperty`

```ts
/** Pass a status ("pending" | "active" | "rejected" | "all") to filter,
 *  or omit for everything. Matches the same params get-properties.php's
 *  landlord-dashboard mode uses. */
export async function adminListProperties(status?: string) {
  const json = await apiGet("admin.php", { action: "list_properties", status });
  return json.data as DbProperty[];
}

export async function adminApproveProperty(id: string) {
  await apiPost("admin.php", { action: "update_property", id, status: "active" });
}

export async function adminRejectProperty(id: string, reason?: string) {
  await apiPost("admin.php", { action: "update_property", id, status: "rejected", admin_notes: reason ?? null });
}
```

This **replaces** the existing `adminListProperties()` (no-arg version) — the new one just makes `status` optional so every existing call site (`adminListProperties()`) keeps working unchanged.
