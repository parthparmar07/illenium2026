import { createClient } from "@/lib/supabase/server";
import { approveParticipant } from "@/services/participant-service";
import { RoleShell } from "@/components/layout/role-shell";
import { demoStore } from "@/services/demo-store";

export default async function VerificationPage() {
  let pendingList: any[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("participants")
      .select("id, illenium_id, college_roll_number, verification_status, registration_status, profiles(full_name, email), colleges(name)")
      .eq("verification_status", "pending")
      .order("created_at");

    if (data && data.length > 0) {
      pendingList = data.map((row) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        const college = Array.isArray(row.colleges) ? row.colleges[0] : row.colleges;
        return {
          id: row.id,
          full_name: profile?.full_name ?? "Participant",
          email: profile?.email ?? "—",
          college: college?.name ?? "Atlas SkillTech University",
          roll_number: row.college_roll_number ?? "—"
        };
      });
    }
  } catch {
    /* fallback to demoStore */
  }

  if (pendingList.length === 0) {
    const demos = demoStore.getAll().filter((d) => d.verificationStatus === "pending");
    pendingList = demos.map((d) => ({
      id: d.id,
      full_name: d.fullName,
      email: d.email,
      college: d.college,
      roll_number: d.collegeRollNumber
    }));
  }

  return (
    <RoleShell role="admin">
      <div className="workspace-page-head">
        <div>
          <div className="workspace-kicker">Review queue</div>
          <h1>Identity verification</h1>
          <p className="workspace-subtitle">Review submitted documents before an ILLENIUM ID and secure QR are issued.</p>
        </div>
        <span className="status-pill status-warning">{pendingList.length} awaiting review</span>
      </div>
      <div className="workspace-panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>College</th>
              <th>Roll number</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingList.map((row) => (
              <tr key={row.id}>
                <td>
                  <strong>{row.full_name}</strong>
                  <small>{row.email}</small>
                </td>
                <td>{row.college}</td>
                <td>{row.roll_number}</td>
                <td>
                  <form action={approveParticipant}>
                    <input type="hidden" name="participantId" value={row.id} />
                    <button className="button button-primary">Approve & issue ID</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!pendingList.length && <p className="workspace-subtitle">The queue is clear.</p>}
      </div>
    </RoleShell>
  );
}
