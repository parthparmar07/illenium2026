"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOpaqueToken, hashToken } from "@/lib/qr/token";
import { encryptToken } from "@/lib/qr/secure-token";
import { demoStore } from "@/services/demo-store";

export async function approveParticipant(formData: FormData) {
  const participantId = String(formData.get("participantId"));
  const db = createAdminClient();

  const demoItem = demoStore.getAll().find((p) => p.id === participantId);

  // Generate or get next ILLENIUM ID
  let illeniumId = "ILL-26-000001";
  try {
    const { data: idData } = await db.rpc("next_illenium_id");
    if (idData) illeniumId = idData as string;
  } catch {
    const count = demoStore.getAll().filter((p) => p.illeniumId).length + 1;
    illeniumId = `ILL-26-${String(count).padStart(6, "0")}`;
  }

  // 1. Update in Supabase DB
  try {
    const token = createOpaqueToken();

    // Try updating by participant ID
    const { data: updatedPart } = await db
      .from("participants")
      .update({ illenium_id: illeniumId, verification_status: "verified", registration_status: "approved" })
      .eq("id", participantId)
      .select("id, profile_id")
      .maybeSingle();

    if (updatedPart) {
      await db
        .from("qr_tokens")
        .upsert(
          { participant_id: updatedPart.id, token_hash: hashToken(token), token_ciphertext: encryptToken(token) },
          { onConflict: "participant_id" }
        );
    } else if (demoItem) {
      // If not matched by ID, update by profile email in DB
      const { data: prof } = await db.from("profiles").select("id").eq("email", demoItem.email).maybeSingle();
      if (prof) {
        await db
          .from("participants")
          .update({ illenium_id: illeniumId, verification_status: "verified", registration_status: "approved" })
          .eq("profile_id", prof.id);

        const { data: part } = await db.from("participants").select("id").eq("profile_id", prof.id).maybeSingle();
        if (part) {
          await db
            .from("qr_tokens")
            .upsert(
              { participant_id: part.id, token_hash: hashToken(token), token_ciphertext: encryptToken(token) },
              { onConflict: "participant_id" }
            );
        }
      }
    }
  } catch {
    // Ignore DB error
  }

  // 2. Always update demoStore
  demoStore.approve(participantId);
  if (demoItem) {
    demoItem.illeniumId = illeniumId;
    demoItem.verificationStatus = "verified";
    demoItem.registrationStatus = "approved";
  }
}
