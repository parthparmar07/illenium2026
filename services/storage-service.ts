import { createClient } from "@/lib/supabase/server";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
export async function uploadPrivateDocument(bucket: "participant-photos" | "college-ids" | "government-ids", path: string, file: File) {
  if (!allowed.has(file.type) || file.size > 5 * 1024 * 1024) throw new Error("File must be JPG, PNG, WEBP or PDF under 5MB.");
  const supabase = await createClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("Upload failed.");
  return path;
}
