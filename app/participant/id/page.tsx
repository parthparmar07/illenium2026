import Link from "next/link";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/qr/secure-token";
import { qrUrl, createOpaqueToken } from "@/lib/qr/token";
import { demoStore } from "@/services/demo-store";

export default async function DigitalIdPage() {
  const supabase = await createClient();
  const adminDb = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  let data: {
    full_name?: string;
    college?: string;
    illenium_id?: string;
    photo_url?: string | null;
    token_ciphertext?: string;
    verification_status?: string;
  } | null = null;

  if (user) {
    try {
      const { data: profile } = await adminDb.from("profiles").select("id, full_name, photo_url, email").eq("user_id", user.id).maybeSingle();

      if (profile) {
        const { data: partRow } = await adminDb
          .from("participants")
          .select("illenium_id, verification_status, colleges(name), qr_tokens(token_ciphertext)")
          .eq("profile_id", profile.id)
          .maybeSingle();

        if (partRow) {
          const college = Array.isArray(partRow.colleges) ? partRow.colleges[0] : partRow.colleges;
          const qr = Array.isArray(partRow.qr_tokens) ? partRow.qr_tokens[0] : partRow.qr_tokens;

          data = {
            full_name: profile.full_name,
            college: college?.name,
            illenium_id: partRow.illenium_id,
            photo_url: profile.photo_url,
            token_ciphertext: qr?.token_ciphertext,
            verification_status: partRow.verification_status
          };
        }

        // Check demoStore for user's email update
        const email = profile.email;
        if (email) {
          const demoItem = demoStore.getAll().find((p) => p.email.toLowerCase() === email.toLowerCase());
          if (demoItem) {
            if (!data) {
              data = {
                full_name: profile.full_name,
                college: demoItem.college,
                illenium_id: demoItem.illeniumId,
                photo_url: profile.photo_url,
                verification_status: demoItem.verificationStatus
              };
            } else if (demoItem.verificationStatus === "verified" || demoItem.illeniumId) {
              data.verification_status = demoItem.verificationStatus;
              data.illenium_id = demoItem.illeniumId || data.illenium_id;
            }
          }
        }
      }
    } catch {
      // Fallback
    }

    if (!data && user?.email) {
      const email = user.email;
      const demoItem = demoStore.getAll().find((p) => p.email.toLowerCase() === email.toLowerCase());
      if (demoItem) {
        data = {
          full_name: demoItem.fullName,
          college: demoItem.college,
          illenium_id: demoItem.illeniumId,
          photo_url: null,
          verification_status: demoItem.verificationStatus
        };
      }
    }
  }

  let qrData = "";
  if (data?.token_ciphertext) {
    try {
      qrData = await QRCode.toDataURL(qrUrl(decryptToken(data.token_ciphertext)), { width: 420, margin: 1 });
    } catch {
      qrData = "";
    }
  }

  if (!qrData && (data?.verification_status === "verified" || !!data?.illenium_id)) {
    try {
      qrData = await QRCode.toDataURL(qrUrl(createOpaqueToken()), { width: 420, margin: 1 });
    } catch {
      qrData = "";
    }
  }

  const isVerified = data?.verification_status === "verified" || !!data?.illenium_id;

  return (
    <div className="app-shell" style={{ background: "#080810", color: "white", minHeight: "100vh" }}>
      <header className="app-nav">
        <Link href="/participant/dashboard" className="brand">
          <span className="brand-mark">
            <span>✦</span>
          </span>{" "}
          ILLENIUM 2026
        </Link>
        <span>DIGITAL ID</span>
      </header>
      <main style={{ padding: "2rem 1rem", display: "grid", placeItems: "center" }}>
        <div className="id-card">
          <div className="id-card-top">
            <span>ILLENIUM / 26</span>
            <span>{isVerified ? "Verified pass" : "Pending verification"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "2rem 0 1rem" }}>
            <img className="id-photo" src={data?.photo_url ?? "/favicon.svg"} alt="Participant profile" />
            <div>
              <h1 style={{ margin: 0, fontSize: "1.5rem" }}>{data?.full_name ?? "Participant"}</h1>
              <p className="muted" style={{ margin: ".3rem 0" }}>{data?.college ?? "Atlas SkillTech University"}</p>
              <strong style={{ color: "var(--blue)", letterSpacing: ".12em" }}>{data?.illenium_id ?? "ID PENDING"}</strong>
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "end" }}>
            <div>
              <div className="muted" style={{ fontSize: ".7rem" }}>STATUS</div>
              <span className={`status ${isVerified ? "green" : "amber"}`}>
                {isVerified ? "Approved" : "Pending Staff Approval"}
              </span>
            </div>
            {qrData ? (
              <img className="id-qr" src={qrData} alt="Secure ILLENIUM QR" />
            ) : (
              <p className="muted" style={{ maxWidth: 150, fontSize: ".75rem" }}>
                Your secure QR appears automatically after an admin approves your registration.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
