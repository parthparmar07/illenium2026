import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/qr/token";
import type { ScanResult } from "@/types/domain";

export async function verifyQrToken(token: string, eventId?: string): Promise<ScanResult> {
  const db = createAdminClient();
  let tokenRow: { participant_id: string; revoked_at: string | null; expires_at: string | null } | null = null;
  let tokenError: { message: string } | null = null;
  if (token.startsWith("ILL-26-")) {
    const lookup = await db.from("participants").select("id, qr_tokens!inner(revoked_at, expires_at)").eq("illenium_id", token).maybeSingle();
    if (lookup.data) { const qr = Array.isArray(lookup.data.qr_tokens) ? lookup.data.qr_tokens[0] : lookup.data.qr_tokens; tokenRow = { participant_id: lookup.data.id, revoked_at: qr?.revoked_at ?? null, expires_at: qr?.expires_at ?? null }; }
    tokenError = lookup.error;
  } else {
    const lookup = await db.from("qr_tokens").select("participant_id, revoked_at, expires_at").eq("token_hash", hashToken(token)).maybeSingle();
    tokenRow = lookup.data; tokenError = lookup.error;
  }
  if (tokenError || !tokenRow || tokenRow.revoked_at || (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date())) return { status: "invalid", message: "The QR could not be verified." };
  const { data: participant, error } = await db.from("participants").select("id, illenium_id, verification_status, registration_status, profiles(full_name, photo_url), colleges(name)").eq("id", tokenRow.participant_id).single();
  if (error || !participant) return { status: "invalid", message: "Participant record not found." };
  const profile = Array.isArray(participant.profiles) ? participant.profiles[0] : participant.profiles;
  const college = Array.isArray(participant.colleges) ? participant.colleges[0] : participant.colleges;
  const safeParticipant = { id: participant.id, illenium_id: participant.illenium_id, full_name: profile?.full_name ?? "Participant", college: college?.name ?? "College", photo_url: profile?.photo_url };
  if (participant.verification_status !== "verified" || participant.registration_status !== "approved") return { status: "pending", participant: safeParticipant, message: "Verification required before entry." };
  if (eventId) {
    const { data: registration } = await db.from("event_registrations").select("id").eq("participant_id", participant.id).eq("event_id", eventId).eq("status", "registered").maybeSingle();
    if (!registration) return { status: "not_registered", participant: safeParticipant, message: "Participant is not registered for this event." };
    const { data: existing } = await db.from("check_ins").select("scanned_at").eq("participant_id", participant.id).eq("event_id", eventId).eq("check_in_type", "event_entry").maybeSingle();
    if (existing) return { status: "already_checked_in", participant: safeParticipant, checkedInAt: existing.scanned_at };
  }
  return { status: "valid", participant: safeParticipant, message: "Participant verified." };
}
