import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/qr/token";
import { demoStore } from "@/services/demo-store";

export async function createCheckIn(
  token: string,
  actorProfileId: string,
  type: "campus_entry" | "event_entry",
  eventId?: string
) {
  const db = createAdminClient();
  const cleanToken = token.trim();
  const nowIso = new Date().toISOString();
  let participantId: string | null = null;
  let participantName = "Participant";
  let illeniumId = cleanToken;
  let eventName = "Main gate";
  let venueName = "Main entrance";

  // 1. Check if token is a manual ILLENIUM ID (e.g. ILL-26-000001)
  if (cleanToken.toUpperCase().startsWith("ILL-26-")) {
    try {
      const { data: part } = await db
        .from("participants")
        .select("id, illenium_id, profiles(full_name)")
        .ilike("illenium_id", cleanToken)
        .maybeSingle();

      if (part) {
        participantId = part.id;
        illeniumId = part.illenium_id ?? cleanToken;
        const profile = Array.isArray(part.profiles) ? part.profiles[0] : part.profiles;
        if (profile?.full_name) participantName = profile.full_name;
      }
    } catch {
      /* ignore */
    }
  }

  // 2. Check if token is a QR token hash
  if (!participantId) {
    try {
      const { data: tokenRow } = await db
        .from("qr_tokens")
        .select("participant_id, participants(id, illenium_id, profiles(full_name))")
        .eq("token_hash", hashToken(cleanToken))
        .is("revoked_at", null)
        .maybeSingle();

      if (tokenRow) {
        participantId = tokenRow.participant_id;
        const part = Array.isArray(tokenRow.participants) ? tokenRow.participants[0] : tokenRow.participants;
        if (part) {
          illeniumId = part.illenium_id ?? cleanToken;
          const profile = Array.isArray(part.profiles) ? part.profiles[0] : part.profiles;
          if (profile?.full_name) participantName = profile.full_name;
        }
      }
    } catch {
      /* ignore */
    }
  }

  // 3. Check demoStore fallback
  if (!participantId) {
    const demoItem = demoStore.getAll().find((p) => p.illeniumId === cleanToken || p.id === cleanToken);
    if (demoItem) {
      participantId = demoItem.id;
      participantName = demoItem.fullName;
      illeniumId = demoItem.illeniumId ?? cleanToken;
    }
  }

  if (!participantId) {
    return { ok: false, message: "Invalid ILLENIUM ID or QR token." };
  }

  // Retrieve Event details if eventId provided
  if (eventId) {
    try {
      const { data: ev } = await db.from("events").select("name, venue").eq("id", eventId).maybeSingle();
      if (ev) {
        eventName = ev.name;
        venueName = ev.venue;
      }
    } catch {
      /* ignore */
    }
  }

  // Execute check-in in Supabase DB
  try {
    const actorIdToUse = actorProfileId || "9ea21ed4-b454-4ffa-a41b-60e43d94dfce"; // default admin profile ID

    // Check existing check-ins to prevent duplicates
    let query = db.from("check_ins").select("id").eq("participant_id", participantId).eq("check_in_type", type);
    if (eventId) {
      query = query.eq("event_id", eventId);
    } else {
      query = query.is("event_id", null);
    }
    const { data: existingCheckIn } = await query.maybeSingle();

    if (existingCheckIn) {
      return { ok: false, message: "Already checked in." };
    }

    const { data, error } = await db.rpc("record_check_in", {
      p_participant_id: participantId,
      p_event_id: eventId || null,
      p_check_in_type: type,
      p_scanned_by: actorIdToUse
    });

    if (error) {
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        return { ok: false, message: "Already checked in." };
      }

      // Direct table insert fallback with real ISO timestamp
      const { data: checkInRow, error: directErr } = await db
        .from("check_ins")
        .insert({
          participant_id: participantId,
          event_id: eventId || null,
          check_in_type: type,
          scanned_by: actorIdToUse,
          attendance_status: "accepted",
          scanned_at: nowIso
        })
        .select("id")
        .single();

      if (directErr) {
        if (directErr.message.includes("duplicate") || directErr.message.includes("unique")) {
          return { ok: false, message: "Already checked in." };
        }
      } else if (checkInRow) {
        // Also record to demoStore for offline sync
        demoStore.addCheckIn({
          id: checkInRow.id,
          participantId: participantId,
          fullName: participantName,
          illeniumId: illeniumId,
          checkInType: type,
          eventName: type === "event_entry" ? eventName : undefined,
          venue: venueName,
          scannedAt: nowIso,
          attendanceStatus: "accepted"
        });
        return { ok: true, data: checkInRow, message: "Check-in recorded successfully." };
      }
    } else if (data) {
      // Record to demoStore for live sync
      demoStore.addCheckIn({
        id: data.id || `checkin-${Date.now()}`,
        participantId: participantId,
        fullName: participantName,
        illeniumId: illeniumId,
        checkInType: type,
        eventName: type === "event_entry" ? eventName : undefined,
        venue: venueName,
        scannedAt: nowIso,
        attendanceStatus: "accepted"
      });
      return { ok: true, data, message: "Check-in recorded successfully." };
    }
  } catch {
    /* ignore DB error, proceed to demoStore fallback */
  }

  // In-memory demoStore fallback for seamless offline operation
  const demoResult = demoStore.addCheckIn({
    id: `checkin-${Date.now()}`,
    participantId: participantId,
    fullName: participantName,
    illeniumId: illeniumId,
    checkInType: type,
    eventName: type === "event_entry" ? eventName : undefined,
    venue: venueName,
    scannedAt: nowIso,
    attendanceStatus: "accepted"
  });

  return { ok: demoResult.ok, message: demoResult.message };
}
