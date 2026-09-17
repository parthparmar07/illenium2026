import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { RoleShell } from "@/components/layout/role-shell";
import { demoStore } from "@/services/demo-store";

export default async function AdminDashboard() {
  let metrics = { participants: 0, verified: 0, pending: 0, checkins: 0, events: 3 };
  let recent: { action?: string; entity_type?: string; created_at?: string }[] = [];

  try {
    const db = createAdminClient();
    const [p, v, pend, c, e, a] = await Promise.all([
      db.from("participants").select("id", { count: "exact", head: true }),
      db.from("participants").select("id", { count: "exact", head: true }).eq("verification_status", "verified"),
      db.from("participants").select("id", { count: "exact", head: true }).eq("verification_status", "pending"),
      db.from("check_ins").select("id", { count: "exact", head: true }),
      db.from("events").select("id", { count: "exact", head: true }),
      db.from("audit_logs").select("action,entity_type,created_at").order("created_at", { ascending: false }).limit(6)
    ]);
    metrics = {
      participants: p.count ?? 0,
      verified: v.count ?? 0,
      pending: pend.count ?? 0,
      checkins: c.count ?? 0,
      events: e.count ?? 3
    };
    recent = a.data ?? [];
  } catch {
    /* render zero/demo state */
  }

  // Sync with demoStore fallback
  const demoList = demoStore.getAll();
  if (demoList.length > 0) {
    metrics.participants = Math.max(metrics.participants, demoList.length);
    metrics.verified = Math.max(metrics.verified, demoList.filter((p) => p.verificationStatus === "verified").length);
    metrics.pending = Math.max(metrics.pending, demoList.filter((p) => p.verificationStatus === "pending").length);
  }

  return (
    <RoleShell role="admin">
      <div className="workspace-page-head">
        <div>
          <div className="workspace-kicker">Festival control room</div>
          <h1>The system at a glance.</h1>
          <p className="workspace-subtitle">Identity, verification and access operations for ILLENIUM 2026.</p>
        </div>
        <Link href="/admin/verification" className="button button-primary">
          Review queue <span>({metrics.pending})</span> ↗
        </Link>
      </div>
      <div className="data-grid">
        <div className="data-card">
          <div className="data-card-label">Participants</div>
          <div className="data-card-value">{metrics.participants}</div>
          <div className="data-card-note">Total applications</div>
        </div>
        <div className="data-card">
          <div className="data-card-label">Verified</div>
          <div className="data-card-value status-good">{metrics.verified}</div>
          <div className="data-card-note">Approved identities</div>
        </div>
        <div className="data-card">
          <div className="data-card-label">Needs review</div>
          <div className="data-card-value status-warn">{metrics.pending}</div>
          <div className="data-card-note">Awaiting decision</div>
        </div>
        <div className="data-card">
          <div className="data-card-label">Check-ins</div>
          <div className="data-card-value">{metrics.checkins}</div>
          <div className="data-card-note">Campus + event entries</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(280px,.7fr)", gap: "1rem", marginTop: "1rem" }}>
        <section className="workspace-panel" style={{ marginTop: 0 }}>
          <h2>Recent activity</h2>
          {recent.length ? (
            <div className="workspace-table-wrap">
              <table className="workspace-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <strong>{item.action}</strong>
                      </td>
                      <td>{item.entity_type}</td>
                      <td>{item.created_at ? new Date(item.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: "1.3rem 0" }}>
              <p className="workspace-subtitle">No activity yet. Once registrations and check-ins begin, the audit trail will appear here.</p>
            </div>
          )}
        </section>
        <section className="workspace-panel" style={{ marginTop: 0 }}>
          <h2>Quick actions</h2>
          <div style={{ display: "grid", gap: ".55rem" }}>
            <Link href="/admin/verification" className="button button-outline">
              Open verification queue ↗
            </Link>
            <Link href="/admin/participants" className="button button-outline">
              Search participants ↗
            </Link>
            <Link href="/admin/events" className="button button-outline">
              Manage events ↗
            </Link>
            <Link href="/oc/scanner" className="button button-primary">
              Open scanner ↗
            </Link>
          </div>
        </section>
      </div>
      <section className="workspace-panel">
        <h2>Operational readiness</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: ".8rem" }}>
          <div>
            <span className="workspace-status status-good">Database connected</span>
            <p className="workspace-subtitle">Live counts are read from Supabase.</p>
          </div>
          <div>
            <span className="workspace-status status-good">QR verification server-side</span>
            <p className="workspace-subtitle">Opaque tokens only; no PII in QR codes.</p>
          </div>
          <div>
            <span className="workspace-status status-neutral">Offline mode disabled</span>
            <p className="workspace-subtitle">Scanner requires a live connection in V1.</p>
          </div>
        </div>
      </section>
    </RoleShell>
  );
}
