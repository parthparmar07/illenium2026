import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const defaultEvents = [
  { id: "10000000-0000-0000-0000-000000000001", name: "Battle of Bands", category: "Music", venue: "Main Arena" },
  { id: "10000000-0000-0000-0000-000000000002", name: "Street Play", category: "Theatre", venue: "Open Air Court" },
  { id: "10000000-0000-0000-0000-000000000003", name: "Frame / Freeze", category: "Visual Arts", venue: "The Gallery" }
];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("events").select("id, name, category, venue, status").eq("status", "open").order("name");
    if (!error && data && data.length > 0) {
      return NextResponse.json({ events: data });
    }
  } catch {
    // Fallback if DB is not populated yet
  }
  return NextResponse.json({ events: defaultEvents });
}
