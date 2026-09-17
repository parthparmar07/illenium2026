import QRCode from "qrcode";
import { RoleShell } from "@/components/layout/role-shell";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/qr/secure-token";
import { qrUrl } from "@/lib/qr/token";
import { demoStore } from "@/services/demo-store";

export default async function DigitalIdPage() {
  let data: {
    full_name?: string;
    college?: string;
    illenium_id?: string;
    photo_url?: string | null;
    token_ciphertext?: string;
    verification_status?: string;
    registration_status?: string;
  } | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      const { data: row } = await supabase
        .from("participants")
        .select("illenium_id, verification_status, registration_status, profiles!inner(full_name, photo_url), colleges(name), qr_tokens(token_ciphertext)")
        .eq("profiles.user_id", user.id)
        .maybeSingle();

      if (row) {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        const college = Array.isArray(row.colleges) ? row.colleges[0] : row.colleges;
        const qr = Array.isArray(row.qr_tokens) ? row.qr_tokens[0] : row.qr_tokens;
        data = {
          full_name: profile?.full_name,
          college: college?.name,
          illenium_id: row.illenium_id,
          photo_url: profile?.photo_url,
          token_ciphertext: qr?.token_ciphertext,
          verification_status: row.verification_status,
          registration_status: row.registration_status
        };
      }
    }
  } catch {
    /* fallback to demoStore */
  }

  // Fallback to demoStore if no Supabase user or data is empty
  if (!data || !data.full_name) {
    const firstDemo = demoStore.getAll()[0];
    if (firstDemo) {
      data = {
        full_name: firstDemo.fullName,
        college: firstDemo.college,
        illenium_id: firstDemo.illeniumId,
        photo_url: null,
        token_ciphertext: undefined,
        verification_status: firstDemo.verificationStatus,
        registration_status: firstDemo.registrationStatus
      };
    }
  }

  let qrData = "";
  if (data?.token_ciphertext && data.verification_status === "verified" && data.registration_status === "approved") {
    try {
      qrData = await QRCode.toDataURL(qrUrl(decryptToken(data.token_ciphertext)), { width: 420, margin: 1 });
    } catch {
      qrData = "";
    }
  } else if (data?.verification_status === "verified") {
    try {
      qrData = await QRCode.toDataURL(qrUrl(data.illenium_id ?? "ILL-26-000001"), { width: 420, margin: 1 });
    } catch {
      qrData = "";
    }
  }

  const status = data?.verification_status === "verified" ? "Verified" : data?.verification_status === "rejected" ? "Needs attention" : "Pending review";

  return (
    <RoleShell role="participant">
      <div className="workspace-page-head">
        <div>
          <div className="workspace-kicker">Your access credential</div>
          <h1>Digital ID</h1>
          <p className="workspace-subtitle">Keep this pass ready at campus entry and every registered event.</p>
        </div>
        <span className={`status-pill ${data?.verification_status === "verified" ? "status-success" : "status-warning"}`}>{status}</span>
      </div>

      <section className="digital-id-layout">
        <div className="id-card">
          <div className="id-card-top">
            <span>ILLENIUM / 26</span>
            <span>{status}</span>
          </div>

          <div className="id-card-person">
            <img className="id-photo" src={data?.photo_url ?? "/favicon.svg"} alt="Participant profile" />
            <div>
              <h2>{data?.full_name ?? "Parth Parmar"}</h2>
              <p>{data?.college ?? "Atlas SkillTech University"}</p>
              <strong>{data?.illenium_id ?? "ILL-26-000001"}</strong>
            </div>
          </div>

          <div className="id-card-bottom">
            <div>
              <small>REGISTRATION</small>
              <span>{data?.registration_status ?? "approved"}</span>
            </div>
            <div>
              <small>QR STATUS</small>
              <span>{qrData ? "Ready to scan" : "Issued after approval"}</span>
            </div>
          </div>

          {qrData ? (
            <img className="id-qr" src={qrData} alt="Secure ILLENIUM QR" />
          ) : (
            <div className="id-pending">Your unique QR appears after registration and identity review are approved.</div>
          )}
        </div>

        <aside className="workspace-panel">
          <div className="workspace-kicker">How to use it</div>
          <h2>One pass, every checkpoint.</h2>
          <p className="workspace-subtitle">
            Show the QR at campus entry, then again at the check-in desk for each event you registered for. It is verified server-side and cannot be reused after a successful check-in.
          </p>
          <div className="id-detail-list">
            <div>
              <span>01</span>
              <p>
                <strong>Campus entry</strong>
                <br />
                Present your pass at the main gate.
              </p>
            </div>
            <div>
              <span>02</span>
              <p>
                <strong>Programme</strong>
                <br />
                Use your dashboard to see where and when to report.
              </p>
            </div>
            <div>
              <span>03</span>
              <p>
                <strong>Event check-in</strong>
                <br />A unique event record prevents duplicate entry.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </RoleShell>
  );
}
