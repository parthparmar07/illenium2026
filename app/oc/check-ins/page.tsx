import { RoleShell } from "@/components/layout/role-shell";
import { createClient } from "@/lib/supabase/server";
import { demoStore } from "@/services/demo-store";

type LogEntry = {
  id: string;
  fullName: string;
  illeniumId: string;
  checkpoint: string;
  eventName: string;
  venueName?: string;
  scannedAt: string;
  attendanceStatus: string;
};

export default async function CheckInsPage() {
  let logs: LogEntry[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("check_ins")
      .select("id, check_in_type, scanned_at, attendance_status, events(name, venue), participants(illenium_id, profiles(full_name))")
      .order("scanned_at", { ascending: false })
      .limit(50);

    if (data && data.length > 0) {
      logs = data.map((row) => {
        const participant = Array.isArray(row.participants) ? row.participants[0] : row.participants;
        const profile = participant && (Array.isArray(participant.profiles) ? participant.profiles[0] : participant.profiles);
        const event = Array.isArray(row.events) ? row.events[0] : row.events;

        return {
          id: row.id,
          fullName: profile?.full_name ?? "Participant",
          illeniumId: participant?.illenium_id ?? "—",
          checkpoint: row.check_in_type === "event_entry" ? "Event entry" : "Campus entry",
          eventName: event ? event.name : "Main gate",
          venueName: event ? event.venue : "Main entrance",
          scannedAt: row.scanned_at,
          attendanceStatus: row.attendance_status ?? "accepted"
        };
      });
    }
  } catch {
    /* fallback to demoStore */
  }

  // Combine with demoStore check-ins
  const demoLogs = demoStore.getCheckIns();
  if (demoLogs.length > 0) {
    const formattedDemo: LogEntry[] = demoLogs.map((d) => ({
      id: d.id,
      fullName: d.fullName,
      illeniumId: d.illeniumId,
      checkpoint: d.checkInType === "event_entry" ? "Event entry" : "Campus entry",
      eventName: d.eventName ?? "Main gate",
      venueName: d.venue ?? "Main entrance",
      scannedAt: d.scannedAt,
      attendanceStatus: d.attendanceStatus
    }));

    // Combine and deduplicate by illeniumId + checkpoint + eventName
    const combined = [...logs, ...formattedDemo];
    const uniqueMap = new Map<string, LogEntry>();
    for (const item of combined) {
      const key = `${item.illeniumId}-${item.checkpoint}-${item.eventName}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    }
    logs = Array.from(uniqueMap.values());
  }

  // Sort by real scannedAt date descending
  logs.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());

  return (
    <RoleShell role="oc">
      <div className="workspace-page-head">
        <div>
          <div className="workspace-kicker">Recent activity</div>
          <h1>Check-in log</h1>
          <p className="workspace-subtitle">The latest accepted scans with real timestamps visible to your operations role.</p>
        </div>
      </div>
      <div className="workspace-panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Participant</th>
              <th>Checkpoint</th>
              <th>Event / venue</th>
              <th>Time</th>
              <th>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((row) => (
              <tr key={row.id}>
                <td>
                  <strong>{row.fullName}</strong>
                  <small>{row.illeniumId}</small>
                </td>
                <td>{row.checkpoint}</td>
                <td>
                  {row.eventName}
                  <small>{row.venueName}</small>
                </td>
                <td>
                  {new Date(row.scannedAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "medium"
                  })}
                </td>
                <td>
                  <span className="status-pill status-success">{row.attendanceStatus}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!logs.length && <p className="workspace-subtitle">No check-ins have been recorded yet.</p>}
      </div>
    </RoleShell>
  );
}
