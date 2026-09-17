import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadPrivateDocument } from "@/services/storage-service";

export async function POST(request: Request) {
  try {
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    const form = await request.formData(); const participantId = String(form.get("participantId")); const bucket = String(form.get("bucket")); const file = form.get("file");
    if (!(file instanceof File) || !participantId || !["participant-photos", "college-ids", "government-ids"].includes(bucket)) return NextResponse.json({ message: "Invalid upload." }, { status: 400 });
    const { data: participant } = await supabase.from("participants").select("id, profile_id, profiles!inner(user_id)").eq("id", participantId).maybeSingle(); const profile = participant && (Array.isArray(participant.profiles) ? participant.profiles[0] : participant.profiles);
    if (!participant || profile?.user_id !== user.id) return NextResponse.json({ message: "Not authorized." }, { status: 403 });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-"); const path = `${user.id}/${participantId}/${crypto.randomUUID()}-${safeName}`; await uploadPrivateDocument(bucket as "participant-photos" | "college-ids" | "government-ids", path, file);
    if (bucket === "participant-photos") await supabase.from("profiles").update({ photo_url: path }).eq("id", participant.profile_id); else await supabase.from("participants").update({ [bucket === "college-ids" ? "college_id_file_path" : "government_id_file_path"]: path }).eq("id", participantId);
    return NextResponse.json({ path }, { status: 201 });
  } catch { return NextResponse.json({ message: "Upload failed." }, { status: 400 }); }
}
