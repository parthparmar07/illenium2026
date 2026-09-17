import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCheckIn } from "@/services/checkin-service";
import { checkinSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = checkinSchema.safeParse(json);
    
    if (!result.success) {
      const issues = result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(" | ");
      return NextResponse.json({ message: `Validation error: ${issues}`, ok: false }, { status: 400 });
    }

    const payload = result.data;
    const supabase = await createClient();
    const adminDb = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    let actorProfileId = "9ea21ed4-b454-4ffa-a41b-60e43d94dfce"; // Default Admin Profile ID

    if (user) {
      const { data: profile } = await adminDb.from("profiles").select("id, role").eq("user_id", user.id).maybeSingle();
      if (profile) {
        actorProfileId = profile.id;
      }
    }

    const res = await createCheckIn(payload.token, actorProfileId, payload.checkInType, payload.eventId || undefined);
    
    return NextResponse.json({
      ok: res.ok,
      message: res.message || (res.ok ? "Check-in saved." : "Check-in failed.")
    }, { status: res.ok ? 200 : 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Check-in could not be recorded.";
    return NextResponse.json({ message: msg, ok: false }, { status: 400 });
  }
}
