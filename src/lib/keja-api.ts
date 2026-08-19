const API_BASE = "http://localhost/get-keja-backend";

export type DbProperty = {
  id: string;
  landlord_id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  images: string[];
  video: string | null;
  county: string;
  estate: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  house_type: string;
  monthly_rent: number;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: number | null;
  amenities: string[];
  house_rules: string[];
  nearby: Record<string, unknown>;
  status: string;
  featured: boolean;
  views_count: number;
  average_rating: number;
  reviews_count: number;
  created_at: string;
  updated_at: string;
  // Present only on results from get-properties.php, which aggregates
  // property_units per property to avoid N+1 lookups.
  units_count?: number;
  vacant_count?: number;
  occupied_count?: number;
  rent_min?: number | null;
  rent_max?: number | null;
};

export type DbUnit = {
  id: string;
  property_id: string;
  label: string;
  is_vacant: boolean;
  monthly_rent: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
};

export type DbFavorite = { id: string; user_id: string; property_id: string; created_at: string };

export type DbVisit = {
  id: string; tenant_id: string; property_id: string; unit_id: string | null;
  scheduled_at: string; notes: string | null; status: string;
  property_name?: string; cover_image?: string | null; county?: string; estate?: string | null;
  tenant_name?: string; tenant_phone?: string | null;
};

export type DbReview = {
  id: string; property_id: string; tenant_id: string; rating: number;
  body: string | null; photos: string[]; status: string; created_at: string;
  property_name?: string; tenant_name?: string;
  landlord_reply?: string | null; replied_at?: string | null;
};

export type DbNotification = {
  id: string; user_id: string; type: string; title: string; body: string | null;
  link: string | null; is_read: boolean; created_at: string;
};

export type DbConversation = {
  id: string; tenant_id: string; landlord_id: string; property_id: string | null;
  last_message_at: string;
  property_name?: string; cover_image?: string | null;
  tenant_name?: string; landlord_name?: string;
};

export type DbMessage = {
  id: string; conversation_id: string; sender_id: string; body: string | null;
  image_url: string | null; created_at: string;
};

export type DbTenantPrefs = {
  user_id: string; budget_min: number | null; budget_max: number | null;
  preferred_counties: string[]; preferred_house_types: string[];
  move_in_date: string | null; notes: string | null;
};

export type DbVerification = {
  id: string; landlord_id: string; status: string; admin_notes: string | null;
  full_name?: string; email?: string; phone?: string | null;
  landlord?: { full_name: string | null; email: string | null; phone: string | null; avatar_url: string | null };
};

export type DbReport = {
  id: string; reporter_id: string; target_type: string; target_id: string;
  category: string; description: string | null; status: string;
};

export type DbTenancy = {
  id: string; property_id: string; unit_id: string | null; tenant_id: string; landlord_id: string;
  since_date: string; monthly_rent: number; balance: number; status: "active" | "ended";
  tenant_name: string; tenant_email: string; tenant_phone: string | null;
  property_name: string; unit_label: string | null;
};

export type DbTransaction = {
  id: number;
  tenancy_id: string | null;
  tenant_id: string;
  landlord_id: string;
  property_id: string | null;
  unit_id: string | null;
  phone: string;
  amount: number;
  admin_fee: number;
  landlord_amount: number;
  status: "pending" | "success" | "failed";
  mpesa_receipt: string | null;
  checkout_request_id: string;
  merchant_request_id: string | null;
  failure_reason: string | null;
  created_at: string;
  confirmed_at: string | null;
  property_name?: string;
  tenant_name?: string;
  landlord_name?: string;
};

export const KENYA_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Kiambu", "Machakos",
  "Uasin Gishu", "Kajiado", "Kilifi", "Nyeri",
];

export const HOUSE_TYPES = [
  "Bedsitter", "Studio", "1 Bedroom", "2 Bedroom", "3 Bedroom", "4 Bedroom", "Maisonette", "Bungalow",
] as const;

export const AMENITY_OPTIONS = [
  "WiFi", "Parking", "Water", "Security", "Furnished", "Balcony", "Gym",
  "Swimming Pool", "Pet Friendly", "Elevator", "Backup Generator", "CCTV",
];

export const formatKsh = (n: number | null | undefined) =>
  n == null ? "—" : "KSh " + Number(n).toLocaleString("en-KE");

export type PropertyFilters = {
  q?: string;
  county?: string;
  estate?: string;
  house_types?: string[];
  min_price?: number;
  max_price?: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  amenities?: string[];
  move_in?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "rating";
  limit?: number;
  offset?: number;
  landlord_id?: string | number;
  /** Pass "all" (e.g. from a landlord's own dashboard) to see every status,
   *  not just active. Public browsing should leave this unset. */
  status?: string;
};

// ---- Small fetch helpers ----
async function apiGet<T = any>(path: string, params: Record<string, any> = {}): Promise<T> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  const url = `${API_BASE}/${path}${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Request failed.");
  return json;
}

async function apiPost<T = any>(path: string, body: Record<string, any> = {}): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Request failed.");
  return json;
}

/**
 * Uploads a single image or video file to the backend and returns its public URL.
 * Unlike apiPost, this sends multipart/form-data since we're posting a real file,
 * not JSON. Requires an `upload-media.php` endpoint on the backend — see the
 * accompanying PHP example.
 */
export async function uploadPropertyMedia(file: File, folder: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const res = await fetch(`${API_BASE}/upload-media.php`, {
    method: "POST",
    body: formData,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Upload failed.");
  return json.url as string;
}

export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`${API_BASE}/upload-image.php`, {
    method: "POST",
    body: fd, // no Content-Type header — the browser sets the multipart boundary itself
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Image upload failed.");
  return json.url as string;
}

// ---- Auth ----
export async function loginWithXampp(email: string, password: string) {
  const json = await apiPost("login.php", { email, password });
  localStorage.setItem("keja_user", JSON.stringify(json.user));
  return json.user;
}

export async function signupWithXampp(input: { fullName: string; email: string; password: string; role: "tenant" | "landlord" }) {
  const json = await apiPost("signup.php", input);
  localStorage.setItem("keja_user", JSON.stringify(json.user));
  return json.user;
}

export function logoutFromXampp() {
  localStorage.removeItem("keja_user");
  window.location.href = "/";
}

export async function requestPasswordReset(email: string) {
  const json = await apiPost("forgot-password.php", { email });
  return json.dev_reset_link as string | undefined;
}

export async function resetPassword(token: string, password: string) {
  await apiPost("reset-password.php", { token, password });
}

export async function updateProfile(input: { user_id: string; full_name?: string; phone?: string; bio?: string; avatar_url?: string }) {
  const json = await apiPost("update-profile.php", input);
  return json.user;
}

// ---- Properties ----
export async function fetchProperties(filters: PropertyFilters = {}) {
  const json = await apiGet("get-properties.php", {
    search: filters.q,
    county: filters.county,
    // Note: house_types (multi-select) isn't supported server-side yet;
    // only the first selected type is applied as a basic filter.
    house_type: filters.house_types?.[0],
    min_rent: filters.min_price,
    max_rent: filters.max_price,
    landlord_id: filters.landlord_id,
    status: filters.status,
    per_page: filters.limit ?? 12,
    page: filters.offset ? Math.floor(filters.offset / (filters.limit ?? 12)) + 1 : 1,
  });
  return { rows: json.data as DbProperty[], count: json.total as number };
}

export async function fetchPropertyById(id: string) {
  const json = await apiGet("get-property.php", { id });
  const p = json.data;
  return {
    property: p as DbProperty,
    units: (p.units ?? []) as DbUnit[],
    reviews: (p.reviews ?? []) as DbReview[],
    landlord: p.landlord ?? null,
  };
}

export type CreatePropertyUnit = {
  label: string;
  house_type: string;
  rent: number;
  status?: "vacant" | "occupied";
};

export async function createProperty(input: {
  landlord_id: string;
  name: string;
  description?: string;
  cover_image?: string;
  images?: string[];
  video?: string | null;
  county: string;
  estate?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  amenities?: string[];
  house_rules?: string[];
  nearby?: Record<string, unknown>;
  area_sqm?: number | null;
  status?: "active" | "inactive" | "draft";
  units: CreatePropertyUnit[];
}) {
  const json = await apiPost("create-property.php", input);
  return json.id as string;
}

/** General field edit on a property the caller owns (name, pricing, location, etc). */
export async function updateProperty(id: string, patch: Partial<DbProperty>) {
  await apiPost("update-property.php", { id, ...patch });
}

/** Bulk-mark every unit on a property vacant or occupied. */
export async function setPropertyUnitsStatus(id: string, status: "vacant" | "occupied") {
  await apiPost("update-property.php", { id, set_all_units_status: status });
}

export async function deleteProperty(id: string, landlordId: string) {
  await apiPost("delete-property.php", { id, landlord_id: landlordId });
}

// ---- Favorites ----
export async function listFavorites(userId: string) {
  const json = await apiGet("get-favorites.php", { user_id: userId });
  return json.data as (DbProperty & { favorite_id: string; favorited_at: string })[];
}

export async function toggleFavorite(userId: string, propertyId: string) {
  const json = await apiPost("toggle-favorite.php", { user_id: userId, property_id: propertyId });
  return json.favorited as boolean;
}

// ---- Tenant preferences ----
export async function fetchTenantPrefs(userId: string) {
  const json = await apiGet("tenant-prefs.php", { user_id: userId });
  return json.data as DbTenantPrefs | null;
}

export async function upsertTenantPrefs(userId: string, patch: Partial<DbTenantPrefs>) {
  await apiPost("tenant-prefs.php", { user_id: userId, ...patch });
}

// ---- Visits ----
export async function bookVisit(input: {
  tenant_id: string; property_id: string; unit_id?: string | null;
  scheduled_at: string; notes?: string;
}) {
  await apiPost("visits.php", { action: "book", ...input });
}

export async function listVisits(tenantId: string) {
  const json = await apiGet("visits.php", { tenant_id: tenantId });
  return json.data as DbVisit[];
}

export async function listVisitsForLandlord(landlordId: string) {
  const json = await apiGet("visits.php", { landlord_id: landlordId });
  return json.data as DbVisit[];
}

export async function updateVisitStatus(id: string, status: string) {
  await apiPost("visits.php", { action: "update_status", id, status });
}

// ---- Notifications ----
export async function listNotifications(userId: string) {
  const json = await apiGet("notifications.php", { user_id: userId });
  // keep a `.read` alias for components written against the older shape
  return (json.data as DbNotification[]).map((n) => ({ ...n, read: n.is_read }));
}

export async function markNotificationRead(id: string) {
  await apiPost("notifications.php", { id });
}

// ---- Reviews ----
export async function listMyReviews(tenantId: string) {
  const json = await apiGet("reviews.php", { tenant_id: tenantId });
  return json.data as DbReview[];
}

export async function listReviewsForLandlord(landlordId: string) {
  const json = await apiGet("reviews.php", { landlord_id: landlordId });
  return json.data as DbReview[];
}

export async function submitReview(input: {
  property_id: string; tenant_id: string; rating: number; body?: string; photos?: string[];
}) {
  await apiPost("reviews.php", input);
}

export async function deleteReview(id: string) {
  await apiPost("reviews.php", { action: "delete", id });
}

export async function replyToReview(reviewId: string, landlordId: string, reply: string) {
  await apiPost("reviews.php", { action: "reply", id: reviewId, landlord_id: landlordId, reply });
}

// ---- Reports ----
export async function submitReport(input: {
  reporter_id: string; target_type: "property" | "user" | "review";
  target_id: string; category: string; description?: string;
}) {
  await apiPost("reports.php", input);
}

// ---- Messaging ----
export async function getOrCreateConversation(tenantId: string, landlordId: string, propertyId?: string | null) {
  const json = await apiPost("messaging.php", {
    action: "get_or_create_conversation",
    tenant_id: tenantId, landlord_id: landlordId, property_id: propertyId ?? null,
  });
  return json.data as DbConversation;
}

export async function listConversations(userId: string) {
  const json = await apiGet("messaging.php", { action: "list_conversations", user_id: userId });
  return json.data as DbConversation[];
}

export async function listMessages(conversationId: string) {
  const json = await apiGet("messaging.php", { action: "list_messages", conversation_id: conversationId });
  return json.data as DbMessage[];
}

export async function sendMessage(conversationId: string, senderId: string, body: string, imageUrl?: string) {
  await apiPost("messaging.php", {
    action: "send_message", conversation_id: conversationId, sender_id: senderId, body, image_url: imageUrl ?? null,
  });
}

// ---- Tenancies ----
export async function listTenancies(landlordId: string) {
  const json = await apiGet("tenancies.php", { landlord_id: landlordId });
  return json.data as DbTenancy[];
}

export async function createTenancy(input: {
  property_id: string; unit_id?: string | null; tenant_id?: string; tenant_email?: string; landlord_id: string;
  since_date: string; monthly_rent: number;
}) {
  await apiPost("tenancies.php", { action: "create", ...input });
}

export async function updateTenancy(id: string, patch: { balance?: number; status?: "active" | "ended" }) {
  await apiPost("tenancies.php", { action: "update", id, ...patch });
}

/* -------------------- Admin helpers -------------------- */

export async function adminStats() {
  const json = await apiGet("admin.php", { action: "stats" });
  return json.data;
}

export async function adminListUsers() {
  const json = await apiGet("admin.php", { action: "list_users" });
  return json.data;
}

export async function adminListVerifications() {
  const json = await apiGet("admin.php", { action: "list_verifications" });
  return json.data as DbVerification[];
}

export async function adminUpdateVerification(id: string, patch: Partial<DbVerification>, reviewerId: string) {
  await apiPost("admin.php", { action: "update_verification", id, reviewer_id: reviewerId, ...patch });
}

export async function adminListReports() {
  const json = await apiGet("admin.php", { action: "list_reports" });
  return json.data as DbReport[];
}

export async function adminUpdateReport(id: string, patch: Partial<DbReport>) {
  await apiPost("admin.php", { action: "update_report", id, ...patch });
}

export async function adminListProperties() {
  const json = await apiGet("admin.php", { action: "list_properties" });
  return json.data as DbProperty[];
}

/** NOTE: as of the current admin.php, this only persists `status` — a
 *  `featured` patch will be silently ignored server-side until admin.php's
 *  update_property action is extended to handle it too. */
export async function adminUpdateProperty(id: string, patch: Partial<DbProperty>) {
  await apiPost("admin.php", { action: "update_property", id, ...patch });
}

export async function adminListReviews() {
  const json = await apiGet("admin.php", { action: "list_reviews" });
  return json.data as DbReview[];
}

export async function adminUpdateReviewStatus(id: string, status: "active" | "hidden" | "deleted") {
  await apiPost("admin.php", { action: "update_review_status", id, status });
}

export async function adminBroadcast(input: { author_id: string; category: string; title: string; body: string }) {
  await apiPost("admin.php", { action: "broadcast", ...input });
}

/* -------------------- Move In (tenant self-service) -------------------- */

export async function moveIn(input: {
  tenant_id: string;
  property_id: string;
  landlord_id: string;
  monthly_rent: number;
  unit_id?: string | null;
}) {
  const json = await apiPost("move-in.php", input);
  return json.id as string;
}

/** A tenant's own tenancies (active and ended), independent of the landlord-scoped listTenancies(). */
export async function listMyTenancies(tenantId: string) {
  const json = await apiGet("my-tenancy.php", { tenant_id: tenantId });
  return json.data as (DbTenancy & { cover_image: string | null })[];
}

/* -------------------- M-Pesa payments -------------------- */

/** Kicks off an STK Push — the tenant gets a prompt on their phone to enter their PIN. */
export async function initiateStkPush(input: {
  tenant_id: string;
  landlord_id: string;
  phone: string;
  amount: number;
  tenancy_id?: string | null;
  property_id?: string | null;
  unit_id?: string | null;
}) {
  const json = await apiPost("mpesa-stk-push.php", input);
  return {
    checkoutRequestId: json.checkout_request_id as string,
    merchantRequestId: json.merchant_request_id as string,
    message: json.message as string,
  };
}

export type MpesaPollResult = {
  status: "pending" | "success" | "failed";
  mpesa_receipt: string | null;
  amount: number;
  failure_reason: string | null;
};

/** Poll this every few seconds after initiateStkPush until status is no longer "pending". */
export async function pollMpesaStatus(checkoutRequestId: string) {
  const json = await apiGet("mpesa-query.php", { checkout_request_id: checkoutRequestId });
  return json.data as MpesaPollResult;
}

/** Convenience helper: polls until success/failed or the timeout elapses. */
export async function waitForMpesaResult(
  checkoutRequestId: string,
  { intervalMs = 3000, timeoutMs = 60000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<MpesaPollResult> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = await pollMpesaStatus(checkoutRequestId);
    if (result.status !== "pending") return result;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return { status: "pending", mpesa_receipt: null, amount: 0, failure_reason: "Timed out waiting for confirmation." };
}

export async function listTransactionsForTenant(tenantId: string) {
  const json = await apiGet("transactions.php", { tenant_id: tenantId });
  return json.data as DbTransaction[];
}

export async function listTransactionsForLandlord(landlordId: string) {
  const json = await apiGet("transactions.php", { landlord_id: landlordId });
  return json.data as DbTransaction[];
}

export async function adminListTransactions() {
  const json = await apiGet("transactions.php", { admin: "1" });
  return json.data as DbTransaction[];
}
export type DbPayout = {
  id: string;
  landlord_id: string;
  amount: number;
  phone: string;
  status: "pending" | "paid" | "rejected";
  admin_notes: string | null;
  mpesa_reference: string | null;
  requested_at: string;
  processed_at: string | null;
  // Only present when fetched via adminListPayouts() (joined from users table)
  landlord_name?: string;
  landlord_email?: string;
};
 
// Then add these three functions anywhere near your other admin/transaction functions:
 
export async function adminListPayouts() {
  const json = await apiGet("payouts.php", { admin: "1" });
  return json.data as DbPayout[];
}
 
export async function adminMarkPayoutPaid(id: string, mpesaReference?: string) {
  await apiPost("payouts.php", { action: "mark_paid", id, mpesa_reference: mpesaReference ?? null });
}
 
export async function adminRejectPayout(id: string, adminNotes?: string) {
  await apiPost("payouts.php", { action: "reject", id, admin_notes: adminNotes ?? null });
}

/* -------------------- Payouts -------------------- */

export async function listPayoutsForLandlord(landlordId: string) {
  const json = await apiGet("payouts.php", { landlord_id: landlordId });
  return {
    rows: json.data as DbPayout[],
    availableBalance: Number(json.available_balance) as number,
  };
}

export async function requestPayout(input: {
  landlord_id: string;
  amount: number;
  phone: string;
}) {
  await apiPost("payouts.php", { action: "request", ...input });
}
/** Replaces every unit on a property with the given set. Requires update-property.php
 *  to handle a `units` key (see note above) — it doesn't yet. */
export async function updatePropertyUnits(propertyId: string, units: CreatePropertyUnit[]) {
  await apiPost("update-property.php", { id: propertyId, units });
}