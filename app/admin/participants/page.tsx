import { createClient } from "@/lib/supabase/server";
import { RoleShell } from "@/components/layout/role-shell";
import { demoStore } from "@/services/demo-store";

export default async function ParticipantsPage() {
  let participantsList: any[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("participants")
      .select("id, illenium_id, college_roll_number, verification_status, registration_status, profiles(full_name, email), colleges(name)")
      .order("created_at", { ascending: false });
    if (data && data.length > 0) {
      participantsList = data.map((row) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        const college = Array.isArray(row.colleges) ? row.colleges[0] : row.colleges;
        return {
          id: row.id,
          full_name: profile?.full_name ?? "Participant",
          email: profile?.email ?? "—",
          college: college?.name ?? "Atlas SkillTech University",
          illenium_id: row.illenium_id ?? "Pending",
          verification_status: row.verification_status ?? "pending"
        };
      });
    }
  } catch {
    /* fallback to demoStore */
  }

  if (participantsList.length === 0) {
    const demos = demoStore.getAll();
    participantsList = demos.map((d) => ({
      id: d.id,
      full_name: d.fullName,
      email: d.email,
      college: d.college,
      illenium_id: d.illeniumId,
      verification_status: d.verificationStatus
    }));
  }

  return (
    <RoleShell role="admin">
      <div className="workspace-page-head">
        <div>
          <div className="workspace-kicker">People</div>
          <h1>Participant directory</h1>
          <p className="workspace-subtitle">A live view of registration, identity review and issued access credentials.</p>
        </div>
      </div>
      <div className="workspace-panel table-wrap">
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
            {participantsList.map((row) => (
              <tr key={row.id}>
                <td>
                  <strong>{row.full_name}</strong>
                </td>
                <td>{row.email}</td>
                <td>{row.college}</td>
                <td>{row.illenium_id}</td>
                <td>
                  <span
                    className={`status-pill ${
                      row.verification_status === "verified"
                        ? "status-success"
                        : row.verification_status === "rejected"
                        ? "status-danger"
                        : "status-warning"
                    }`}
                  >
                    {row.verification_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!participantsList.length && <p className="workspace-subtitle">No participant records yet.</p>}
      </div>
    </RoleShell>
  );
}
