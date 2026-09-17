import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const fallbackEvents = [{ name: "Battle of Bands", category: "Music", venue: "Main Arena", description: "A live band showdown built for the loudest room on campus.", status: "open" }, { name: "Street Play", category: "Theatre", venue: "Open Air Court", description: "Stories, satire and movement in the middle of the crowd.", status: "open" }, { name: "Frame / Freeze", category: "Visual Arts", venue: "The Gallery", description: "A visual arts event for photographs that refuse to sit still.", status: "open" }];

export default async function EventsPage() {
  let events = fallbackEvents;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) { const supabase = await createClient(); const { data } = await supabase.from("events").select("name, category, venue, description, status").eq("status", "open").order("start_time"); if (data?.length) events = data; }
  return <main className="section"><div className="eyebrow">ILLENIUM 2026 programme</div><h1 className="display" style={{ fontSize: "clamp(3.5rem,8vw,7rem)", margin: "1rem 0" }}>Choose your<br /><span style={{ color: "var(--violet)" }}>moment.</span></h1><p className="muted" style={{ maxWidth: 550, lineHeight: 1.6 }}>Browse the open programme and register for the events that belong in your festival story.</p><div className="grid-3" style={{ marginTop: "3rem" }}>{events.map((event) => <article className="event-card" key={event.name}><div className="event-meta"><span>{event.category}</span><span>{event.status}</span></div><div><h3>{event.name}</h3><p className="muted">{event.description}</p><p className="muted">Venue · {event.venue}</p></div><Link className="btn btn-ghost" href="/register">Register for this event →</Link></article>)}</div></main>;
}
