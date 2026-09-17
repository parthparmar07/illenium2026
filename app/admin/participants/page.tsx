import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { demoStore } from "@/services/demo-store";

export default async function ParticipantsPage() {
  const adminDb = createAdminClient();
  let participants: any[] = [];

  try {
    const { data } = await adminDb
      .from("participants")
      .select("id, illenium_id, college_roll_number, verification_status, registration_status, profiles(full_name, email), colleges(name)")
      .order("created_at", { ascending: false });
    if (data && data.length > 0) participants = data;
  } catch {
    // Fallback if DB query fails
  }

  // Merge demoStore items
  const demoList = demoStore.getAll();
  for (const d of demoList) {
    if (!participants.some((p) => p.id === d.id)) {
      participants.push({
        id: d.id,
        illenium_id: d.illeniumId,
        college_roll_number: d.collegeRollNumber,
        verification_status: d.verificationStatus,
        registration_status: d.registrationStatus,
        profiles: { full_name: d.fullName, email: d.email },
        colleges: { name: d.college }
      });
    }
  }

  return (
    <div className="app-shell">
      <header className="app-nav">
        <Link href="/admin/dashboard" className="brand">
          <span className="brand-mark">
            <span>✦</span>
          </span>{" "}
          ILLENIUM 2026
        </Link>
        <span>PARTICIPANTS</span>
      </header>
      <main className="app-main">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "2.5rem", margin: 0 }}>Participants ({participants.length})</h1>
          <Link href="/admin/verification" className="btn btn-primary">
            Verification Queue
          </Link>
        </div>
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>College</th>
                <th>ILLENIUM ID</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((row) => {
                const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
                const college = Array.isArray(row.colleges) ? row.colleges[0] : row.colleges;
                return (
                  <tr key={row.id}>
                    <td>{profile?.full_name || "Participant"}</td>
                    <td>{profile?.email || "—"}</td>
                    <td>{college?.name || "Atlas SkillTech University"}</td>
                    <td>{row.illenium_id ?? "Pending"}</td>
                    <td>
                      <span
                        className={`status ${
                          row.verification_status === "verified"
                            ? "green"
                            : row.verification_status === "rejected"
                            ? "red"
                            : "amber"
                        }`}
                      >
                        {row.verification_status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!participants.length && <p className="muted" style={{ padding: "1rem" }}>No participants registered yet.</p>}
        </div>
      </main>
    </div>
  );
}
