import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckIn } from "@/services/checkin-service";
import { checkinSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    const payload = checkinSchema.parse(await request.json()); const { data: profile } = await supabase.from("profiles").select("id, role").eq("user_id", user.id).single();
    if (!profile || !["oc", "admin", "executive_core"].includes(profile.role)) return NextResponse.json({ message: "Not authorized." }, { status: 403 });
    return NextResponse.json(await createCheckIn(payload.token, profile.id, payload.checkInType, payload.eventId));
  } catch { return NextResponse.json({ message: "Check-in could not be recorded." }, { status: 400 }); }
}
