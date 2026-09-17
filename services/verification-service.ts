import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/qr/token";
import type { ScanResult } from "@/types/domain";
import { demoStore } from "@/services/demo-store";

export async function verifyQrToken(token: string, eventId?: string): Promise<ScanResult> {
  const db = createAdminClient();
  const cleanToken = token.trim();

  // 1. Direct Manual ILLENIUM ID Lookup (e.g. ILL-26-000001)
  if (cleanToken.toUpperCase().startsWith("ILL-26-")) {
    try {
      const { data: participant, error } = await db
        .from("participants")
        .select("id, illenium_id, verification_status, registration_status, profiles(full_name, photo_url), colleges(name)")
        .ilike("illenium_id", cleanToken)
        .maybeSingle();

      if (!error && participant) {
        const profile = Array.isArray(participant.profiles) ? participant.profiles[0] : participant.profiles;
        const college = Array.isArray(participant.colleges) ? participant.colleges[0] : participant.colleges;
        const safeParticipant = {
          id: participant.id,
          illenium_id: participant.illenium_id,
          full_name: profile?.full_name ?? "Participant",
          college: college?.name ?? "Atlas SkillTech University",
          photo_url: profile?.photo_url
        };

        if (participant.verification_status !== "verified" || participant.registration_status !== "approved") {
          return { status: "pending", participant: safeParticipant, message: "Verification required before entry." };
        }

        if (eventId) {
          const { data: existing } = await db
            .from("check_ins")
            .select("scanned_at")
            .eq("participant_id", participant.id)
            .eq("event_id", eventId)
            .eq("check_in_type", "event_entry")
            .maybeSingle();
          if (existing) return { status: "already_checked_in", participant: safeParticipant, checkedInAt: existing.scanned_at };
        }

        return { status: "valid", participant: safeParticipant, message: "Participant verified." };
      }
    } catch {
      // ignore
    }
  }

  // 2. QR Token Hash Lookup
  try {
    const { data: tokenRow, error: tokenError } = await db
      .from("qr_tokens")
      .select("participant_id, revoked_at, expires_at")
      .eq("token_hash", hashToken(cleanToken))
      .maybeSingle();

    if (!tokenError && tokenRow && !tokenRow.revoked_at && (!tokenRow.expires_at || new Date(tokenRow.expires_at) >= new Date())) {
      const { data: participant, error } = await db
        .from("participants")
        .select("id, illenium_id, verification_status, registration_status, profiles(full_name, photo_url), colleges(name)")
        .eq("id", tokenRow.participant_id)
        .maybeSingle();

      if (!error && participant) {
        const profile = Array.isArray(participant.profiles) ? participant.profiles[0] : participant.profiles;
        const college = Array.isArray(participant.colleges) ? participant.colleges[0] : participant.colleges;
        const safeParticipant = {
          id: participant.id,
          illenium_id: participant.illenium_id,
          full_name: profile?.full_name ?? "Participant",
          college: college?.name ?? "Atlas SkillTech University",
          photo_url: profile?.photo_url
        };

        if (participant.verification_status !== "verified" || participant.registration_status !== "approved") {
          return { status: "pending", participant: safeParticipant, message: "Verification required before entry." };
        }

        return { status: "valid", participant: safeParticipant, message: "Participant verified." };
      }
    }
  } catch {
    // ignore
  }

  // 3. Fallback to demoStore
  const demoList = demoStore.getAll();
  const demoParticipant = demoList.find(
    (p) =>
      (p.illeniumId && p.illeniumId.toLowerCase() === cleanToken.toLowerCase()) ||
      p.id.toLowerCase() === cleanToken.toLowerCase()
  );

  if (demoParticipant) {
    const safe = {
      id: demoParticipant.id,
      illenium_id: demoParticipant.illeniumId || cleanToken,
      full_name: demoParticipant.fullName,
      college: demoParticipant.college,
      photo_url: null
    };

    if (demoParticipant.verificationStatus !== "verified") {
      return { status: "pending", participant: safe, message: "Verification required before entry." };
    }

    return { status: "valid", participant: safe, message: "Participant verified." };
  }

  return { status: "invalid", message: "The QR or ID could not be verified." };
}
