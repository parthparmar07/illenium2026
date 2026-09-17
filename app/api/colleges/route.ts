import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const defaultColleges = [
  { id: "00000000-0000-0000-0000-000000000001", name: "Atlas SkillTech University", short_name: "Atlas", code: "ATLAS" },
  { id: "00000000-0000-0000-0000-000000000002", name: "Raman Institute of Technology", short_name: "RIT", code: "RIT" },
  { id: "00000000-0000-0000-0000-000000000003", name: "Western Arts College", short_name: "WAC", code: "WAC" }
];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("colleges").select("id, name, short_name, code").order("name");
    if (!error && data && data.length > 0) {
      return NextResponse.json({ colleges: data });
    }
  } catch {
    // Fallback if DB is not populated yet
  }
  return NextResponse.json({ colleges: defaultColleges });
}
