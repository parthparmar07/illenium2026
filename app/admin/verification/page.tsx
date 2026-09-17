import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveParticipant } from "@/services/participant-service";
import { demoStore } from "@/services/demo-store";

export default async function VerificationPage() {
  const adminDb = createAdminClient();
  let pendingList: any[] = [];

  try {
    const { data } = await adminDb
      .from("participants")
      .select("id, illenium_id, college_roll_number, verification_status, registration_status, profiles(full_name, email), colleges(name)")
      .eq("verification_status", "pending")
      .order("created_at");
    if (data && data.length > 0) pendingList = data;
  } catch {
    // Fallback if DB query fails
  }

  // Merge demoStore pending items
  const demoPending = demoStore.getAll().filter((p) => p.verificationStatus === "pending");
  for (const d of demoPending) {
    if (!pendingList.some((p) => p.id === d.id)) {
      pendingList.push({
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
        <span>VERIFICATION QUEUE</span>
      </header>
      <main className="app-main">
        <h1 style={{ fontSize: "2.5rem" }}>Pending Verification ({pendingList.length})</h1>
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>College</th>
                <th>Roll number</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingList.map((row) => {
                const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
                const college = Array.isArray(row.colleges) ? row.colleges[0] : row.colleges;
                return (
                  <tr key={row.id}>
                    <td>{profile?.full_name || "Participant"}</td>
                    <td>{profile?.email || "—"}</td>
                    <td>{college?.name || "Atlas SkillTech University"}</td>
                    <td>{row.college_roll_number}</td>
                    <td>
                      <form action={approveParticipant}>
                        <input type="hidden" name="participantId" value={row.id} />
                        <button className="btn btn-primary" style={{ padding: ".4rem .8rem", fontSize: ".8rem" }}>
                          Approve & generate ID
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!pendingList.length && <p className="muted" style={{ padding: "1rem" }}>No pending participants awaiting approval.</p>}
        </div>
      </main>
    </div>
  );
}
