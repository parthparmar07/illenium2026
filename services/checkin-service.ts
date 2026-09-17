import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/qr/token";

export async function createCheckIn(token: string, actorProfileId: string, type: "campus_entry" | "event_entry", eventId?: string) {
  const db = createAdminClient();
  const { data: tokenRow, error: tokenError } = await db.from("qr_tokens").select("participant_id").eq("token_hash", hashToken(token)).is("revoked_at", null).maybeSingle();
  if (tokenError || !tokenRow) return { ok: false, message: "Invalid QR token." };
  const { data, error } = await db.rpc("record_check_in", { p_participant_id: tokenRow.participant_id, p_event_id: eventId ?? null, p_check_in_type: type, p_scanned_by: actorProfileId });
  if (error) return { ok: false, message: error.message.includes("duplicate") ? "Already checked in." : "Check-in could not be recorded." };
  return { ok: true, data };
}
