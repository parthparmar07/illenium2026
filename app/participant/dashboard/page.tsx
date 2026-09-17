import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { demoStore } from "@/services/demo-store";

export default async function ParticipantDashboard() {
  const supabase = await createClient();
  const adminDb = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  let participant: {
    illenium_id?: string;
    verification_status?: string;
    registration_status?: string;
    colleges?: { name?: string };
  } | null = null;

  let events: { name?: string; venue?: string; category?: string }[] = [];

  if (user) {
    try {
      const { data: profile } = await adminDb.from("profiles").select("id, email").eq("user_id", user.id).maybeSingle();

      if (profile) {
        const { data: partRow } = await adminDb
          .from("participants")
          .select("id, illenium_id, verification_status, registration_status, colleges(name)")
          .eq("profile_id", profile.id)
          .maybeSingle();

        if (partRow) {
          participant = {
            illenium_id: partRow.illenium_id,
            verification_status: partRow.verification_status,
            registration_status: partRow.registration_status,
            colleges: Array.isArray(partRow.colleges) ? partRow.colleges[0] : partRow.colleges
          };

          const { data: regRows } = await adminDb
            .from("event_registrations")
            .select("events(name, venue, category)")
            .eq("participant_id", partRow.id);

          if (regRows) {
            events = regRows.map((r: any) => (Array.isArray(r.events) ? r.events[0] : r.events)).filter(Boolean);
          }
        }

        const email = profile.email;
        if (email) {
          const demoItem = demoStore.getAll().find((p) => p.email.toLowerCase() === email.toLowerCase());
          if (demoItem) {
            if (!participant) {
              participant = {
                illenium_id: demoItem.illeniumId,
                verification_status: demoItem.verificationStatus,
                registration_status: demoItem.registrationStatus,
                colleges: { name: demoItem.college }
              };
              events = demoItem.events;
            } else if (demoItem.verificationStatus === "verified" || demoItem.illeniumId) {
              participant.verification_status = demoItem.verificationStatus;
              participant.registration_status = demoItem.registrationStatus;
              participant.illenium_id = demoItem.illeniumId || participant.illenium_id;
            }
          }
        }
      }
    } catch {
      // Fallback
    }

    if (!participant && user?.email) {
      const email = user.email;
      const demoItem = demoStore.getAll().find((p) => p.email.toLowerCase() === email.toLowerCase());
      if (demoItem) {
        participant = {
          illenium_id: demoItem.illeniumId,
          verification_status: demoItem.verificationStatus,
          registration_status: demoItem.registrationStatus,
          colleges: { name: demoItem.college }
        };
        events = demoItem.events;
      }
    }
  }

  return (
    <div className="app-shell">
      <header className="app-nav">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <span>✦</span>
          </span>{" "}
          ILLENIUM 2026
        </Link>
        <span>PARTICIPANT</span>
      </header>
      <main className="app-main">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: "#7753ef" }}>
              Your festival passport
            </div>
            <h1 style={{ fontSize: "clamp(2rem,5vw,4rem)", margin: ".5rem 0" }}>Dashboard</h1>
          </div>
          <Link href="/participant/id" className="btn btn-primary">
            Open digital ID
          </Link>
        </div>
        <div className="app-grid">
          <div className="metric">
            <span className="muted">ILLENIUM ID</span>
            <div className="metric-value">{participant?.illenium_id ?? "Pending"}</div>
          </div>
          <div className="metric">
            <span className="muted">Registration</span>
            <div className="metric-value" style={{ fontSize: "1.35rem", textTransform: "capitalize" }}>
              {participant?.registration_status ?? "Submitted"}
            </div>
          </div>
          <div className="metric">
            <span className="muted">Verification</span>
            <div className="metric-value" style={{ fontSize: "1.35rem", textTransform: "capitalize" }}>
              {participant?.verification_status ?? "Pending"}
            </div>
          </div>
          <div className="metric">
            <span className="muted">Events</span>
            <div className="metric-value">{events.length}</div>
          </div>
        </div>
        <div className="panel" style={{ marginTop: "1rem" }}>
          <h2>Your programme</h2>
          {events.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Category</th>
                    <th>Venue</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e, index) => (
                    <tr key={index}>
                      <td><strong>{e.name}</strong></td>
                      <td>{e.category}</td>
                      <td>{e.venue}</td>
                      <td>
                        <span className="status green">Registered</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">
              {participant ? "You are registered for campus entry. Browse open events to sign up!" : "Your registered events will appear here once you complete registration."}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
