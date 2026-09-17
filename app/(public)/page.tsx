import Link from "next/link";

const events = [
  { name: "Battle of Bands", category: "Music", venue: "Main Arena", detail: "Live bands. Loud rooms. One final stage." },
  { name: "Street Play", category: "Theatre", venue: "Open Air Court", detail: "Stories that move through the crowd." },
  { name: "Frame / Freeze", category: "Visual Arts", venue: "The Gallery", detail: "A competition for the eye and the unexpected." }
];

export default function Home() {
  return <main>
    <section className="hero"><div><div className="eyebrow">Atlas SkillTech University · Mumbai</div><h1 className="display">Make noise.<br /><span style={{ color: "var(--violet)" }}>Leave a mark.</span></h1><p>ILLENIUM is the intercollegiate festival where every participant, every event and every unforgettable moment meets under one identity.</p><div className="hero-actions"><Link href="/register" className="btn btn-primary">Register now ↗</Link><Link href="/events" className="btn btn-ghost">Explore events</Link></div></div><div className="hero-stamp"><img src="https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=700&q=80" alt="Crowd at a live performance" /><div className="stamp-caption"><span>ILLENIUM / 26</span><span>01 — 04</span></div></div></section>
    <div className="band"><span>ONE IDENTITY</span><span>EVERY MOMENT</span><span>SEE YOU IN THE CROWD</span><span>ONE IDENTITY</span><span>EVERY MOMENT</span></div>
    <section className="section"><div className="section-head"><div><div className="eyebrow">The programme</div><h2 className="display">Find your stage.</h2></div><Link href="/events" className="btn btn-ghost">All events ↗</Link></div><div className="grid-3">{events.map((event) => <article className="event-card" key={event.name}><div className="event-meta"><span>{event.category}</span><span>{event.venue}</span></div><div><h3>{event.name}</h3><p className="muted">{event.detail}</p></div><Link href="/events" className="muted" style={{ fontSize: ".8rem" }}>View event →</Link></article>)}</div></section>
    <section className="section" style={{ background: "linear-gradient(115deg, #11111c, #191029)" }}><div style={{ maxWidth: 800 }}><div className="eyebrow">Built for the day</div><h2 className="display">One ID. Every door.</h2><p className="muted" style={{ fontSize: "1.1rem", lineHeight: 1.7 }}>Your ILLENIUM ID connects your college, contingency, events and check-ins in one secure pass. Register once. Show up ready.</p><Link href="/register" className="btn btn-primary">Create your ILLENIUM ID</Link></div></section>
  </main>;
}
