import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { demoStore } from "@/services/demo-store";

export default async function AdminDashboard() {
  let participants = 0;
  let verified = 0;
  let pending = 0;
  let checkins = 0;

  try {
    const adminDb = createAdminClient();
    const [pRes, vRes, pendRes, cRes] = await Promise.all([
      adminDb.from("participants").select("id", { count: "exact", head: true }),
      adminDb.from("participants").select("id", { count: "exact", head: true }).eq("verification_status", "verified"),
      adminDb.from("participants").select("id", { count: "exact", head: true }).eq("verification_status", "pending"),
      adminDb.from("check_ins").select("id", { count: "exact", head: true })
    ]);

    participants = pRes.count ?? 0;
    verified = vRes.count ?? 0;
    pending = pendRes.count ?? 0;
    checkins = cRes.count ?? 0;
  } catch {
    // Fallback to demoStore
  }

  const demoList = demoStore.getAll();
  if (demoList.length > 0) {
    participants = Math.max(participants, demoList.length);
    verified = Math.max(verified, demoList.filter((p) => p.verificationStatus === "verified").length);
    pending = Math.max(pending, demoList.filter((p) => p.verificationStatus === "pending").length);
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
        <span>ADMIN CONSOLE</span>
      </header>
      <main className="app-main">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: "#7753ef" }}>
              Operations overview
            </div>
            <h1 style={{ fontSize: "clamp(2rem,5vw,4rem)", margin: ".5rem 0" }}>Control room</h1>
          </div>
          <Link href="/admin/verification" className="btn btn-primary">
            Review pending ({pending})
          </Link>
        </div>
        <div className="app-grid">
          <div className="metric">
            <span className="muted">Total participants</span>
            <div className="metric-value">{participants}</div>
          </div>
          <div className="metric">
            <span className="muted">Verified</span>
            <div className="metric-value">{verified}</div>
          </div>
          <div className="metric">
            <span className="muted">Pending review</span>
            <div className="metric-value">{pending}</div>
          </div>
          <div className="metric">
            <span className="muted">Total check-ins</span>
            <div className="metric-value">{checkins}</div>
          </div>
        </div>
        <div className="panel" style={{ marginTop: "1rem" }}>
          <h2>Operational areas</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: ".8rem" }}>
            <Link className="btn btn-ghost" href="/admin/verification">
              Verification queue ({pending})
            </Link>
            <Link className="btn btn-ghost" href="/admin/participants">
              Participants list ({participants})
            </Link>
            <Link className="btn btn-ghost" href="/admin/events">
              Events
            </Link>
            <Link className="btn btn-ghost" href="/oc/scanner">
              Scanner
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
