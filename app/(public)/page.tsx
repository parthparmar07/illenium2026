import Link from "next/link";

const events = [
  { date: "01 / 04", category: "Music", name: "Battle of Bands", venue: "Main Arena", time: "18:30 — 21:30", copy: "Turn the volume up. A live band showdown for the final stage." },
  { date: "02 / 04", category: "Theatre", name: "Street Play", venue: "Open Air Court", time: "16:00 — 18:00", copy: "Stories, satire and movement — performed where the crowd is." },
  { date: "03 / 04", category: "Visual arts", name: "Frame / Freeze", venue: "The Gallery", time: "11:00 — 16:00", copy: "A visual competition for photographs that refuse to sit still." }
];

export default function Home() {
  return (
    <>
      <main>
        <section className="festival-hero">
          {/* Dynamic Moving Photo Background Layer */}
          <div className="hero-bg-photo" />
          
          <div className="hero-copy">
            <div className="hero-kicker">Atlas SkillTech University · 04 days · 01 campus</div>
            <h1 className="display">
              The campus is<br />
              <em>about to get loud.</em>
            </h1>
            <p>ILLENIUM is where Mumbai’s colleges meet for four days of music, theatre, movement and impossible-to-repeat moments.</p>
            <div className="hero-ctas">
              <Link href="/register" className="button button-primary">
                Get your ILLENIUM ID ↗
              </Link>
              <Link href="/events" className="button button-outline">
                Explore the programme
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-poster">
              <div className="poster-image">
                <div className="poster-title">
                  <strong>
                    Make a<br />
                    mark.
                  </strong>
                  <span>ILLENIUM / 2026</span>
                </div>
              </div>
              <div className="poster-footer">
                <span>Atlas campus / Mumbai</span>
                <span>01 — 04</span>
              </div>
            </div>
          </div>
        </section>

        <div className="marquee">
          <div className="marquee-track">
            <span>ONE IDENTITY</span>
            <b>✦</b>
            <span>EVERY MOMENT</span>
            <b>✦</b>
            <span>SHOW UP FOR THE STORY</span>
            <b>✦</b>
            <span>ONE IDENTITY</span>
            <b>✦</b>
            <span>EVERY MOMENT</span>
            <b>✦</b>
            <span>SHOW UP FOR THE STORY</span>
          </div>
        </div>

        <section className="public-section public-section-light">
          <div className="section-heading">
            <div>
              <div className="section-kicker" style={{ color: "#6d57c6" }}>
                The 2026 programme
              </div>
              <h2 className="serif">
                Pick your<br />
                moment.
              </h2>
            </div>
            <p>Three stages. One campus. A programme made for people who want to be in the room, not just watch it.</p>
          </div>
          <div className="event-lineup">
            {events.map((event) => (
              <article className="lineup-card" key={event.name}>
                <div className="lineup-top">
                  <span>{event.date}</span>
                  <span>{event.category}</span>
                </div>
                <div>
                  <h3>{event.name}</h3>
                  <p>{event.copy}</p>
                </div>
                <div className="lineup-bottom">
                  <span>
                    {event.venue} · {event.time}
                  </span>
                  <span className="lineup-arrow">↗</span>
                </div>
              </article>
            ))}
          </div>
          <div style={{ marginTop: "1.4rem" }}>
            <Link href="/events" className="button button-outline" style={{ color: "#1a1b20", borderColor: "#b6b5b0" }}>
              See the full programme ↗
            </Link>
          </div>
        </section>

        <section className="public-section">
          <div className="story-grid">
            <div className="story-image" />
            <div className="story-copy">
              <div className="section-kicker">More than a registration</div>
              <h2 className="serif">
                Your pass<br />
                has a pulse.
              </h2>
              <p>One ILLENIUM ID connects your college, contingency, events and access. Register once, keep your schedule close, and let the festival take care of the rest.</p>
              <div className="story-list">
                <div>
                  <strong>01</strong>
                  <span>identity</span>
                </div>
                <div>
                  <strong>04</strong>
                  <span>days of play</span>
                </div>
                <div>
                  <strong>∞</strong>
                  <span>ways to show up</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="identity-banner">
          <div className="section-kicker">Start with one decision</div>
          <h2 className="serif">
            Find your people.<br />
            Find your stage.
          </h2>
          <p>Registration takes a few minutes. Your digital ID is generated after verification and works wherever the festival needs to recognise you.</p>
          <div className="hero-ctas">
            <Link href="/register" className="button button-primary">
              Create your pass ↗
            </Link>
            <Link href="/about" className="button button-outline">
              About ILLENIUM
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
