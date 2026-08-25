/**
 * Shared format validators for phone numbers and emails.
 * Used to give real-time "is this well-formed" feedback in forms —
 * this is separate from OTP verification (actually proving ownership).
 */

// Kenyan mobile format: 07XXXXXXXX, 01XXXXXXXX, or +254/254 7XXXXXXXX / 1XXXXXXXX
const KE_PHONE_RE = /^(?:\+254|254|0)(7\d{8}|1\d{8})$/;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidKenyanPhone(raw: string): boolean {
  const cleaned = raw.trim().replace(/[\s-]/g, "");
  return KE_PHONE_RE.test(cleaned);
}

/** Normalizes a Kenyan phone number to the 2547XXXXXXXX / 2541XXXXXXXX format used by M-Pesa. */
export function normalizeKenyanPhone(raw: string): string {
  const cleaned = raw.trim().replace(/[\s-]/g, "");
  if (cleaned.startsWith("+254")) return cleaned.slice(1);
  if (cleaned.startsWith("254")) return cleaned;
  if (cleaned.startsWith("0")) return "254" + cleaned.slice(1);
  return cleaned;
}

export function isValidEmail(raw: string): boolean {
  return EMAIL_RE.test(raw.trim());
}

export type FieldState = "empty" | "valid" | "invalid";

export function phoneFieldState(raw: string): FieldState {
  if (!raw.trim()) return "empty";
  return isValidKenyanPhone(raw) ? "valid" : "invalid";
}

export function emailFieldState(raw: string): FieldState {
  if (!raw.trim()) return "empty";
  return isValidEmail(raw) ? "valid" : "invalid";
}
