"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const steps = ["Personal", "College", "Identity", "Events", "Emergency", "Review"];

type College = { id: string; name: string; short_name: string; code: string };
type EventItem = { id: string; name: string; category: string; venue: string };

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  collegeId: string;
  collegeRollNumber: string;
  emergencyName: string;
  emergencyPhone: string;
  eventIds: string[];
};

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [usedPassword, setUsedPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [colleges, setColleges] = useState<College[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);

  const [photo, setPhoto] = useState<File | null>(null);
  const [collegeIdFile, setCollegeIdFile] = useState<File | null>(null);

  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    collegeId: "",
    collegeRollNumber: "",
    emergencyName: "",
    emergencyPhone: "",
    eventIds: []
  });

  useEffect(() => {
    fetch("/api/colleges")
      .then((res) => res.json())
      .then((data) => {
        if (data.colleges?.length) {
          setColleges(data.colleges);
          if (!form.collegeId) {
            setForm((prev) => ({ ...prev, collegeId: data.colleges[0].id }));
          }
        }
      })
      .catch(() => {});

    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (data.events?.length) {
          setEventsList(data.events);
        }
      })
      .catch(() => {});
  }, []);

  const update = (key: keyof FormState, value: string) => setForm((old) => ({ ...old, [key]: value }));

  const toggleEvent = (eventId: string) => {
    setForm((old) => ({
      ...old,
      eventIds: old.eventIds.includes(eventId)
        ? old.eventIds.filter((id) => id !== eventId)
        : [...old.eventIds, eventId]
    }));
  };

  async function submit() {
    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/participants", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form)
      });

      const body = (await response.json()) as { message?: string; participantId?: string; registeredEmail?: string };

      if (!response.ok || !body.participantId) {
        setMessage(body.message ?? "Registration could not be submitted.");
        setSubmitting(false);
        return;
      }

      const emailToUse = body.registeredEmail || form.email;
      const pwdToUse = form.password && form.password.length >= 6 ? form.password : "Illenium2026!";
      setRegisteredEmail(emailToUse);
      setUsedPassword(pwdToUse);

      // Attempt automatic client login
      try {
        await createClient().auth.signInWithPassword({
          email: emailToUse,
          password: pwdToUse
        });
      } catch {
        // Ignore auth error in unseeded demo mode
      }

      for (const [file, bucket] of [
        [photo, "participant-photos"],
        [collegeIdFile, "college-ids"]
      ] as const) {
        if (file) {
          const upload = new FormData();
          upload.append("participantId", body.participantId);
          upload.append("bucket", bucket);
          upload.append("file", file);
          await fetch("/api/uploads", { method: "POST", body: upload }).catch(() => {});
        }
      }

      setSubmitted(true);
    } catch {
      setMessage("An error occurred while submitting your registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted)
    return (
      <main className="section" style={{ maxWidth: 720 }}>
        <div className="eyebrow">Registration received</div>
        <h1 className="display" style={{ fontSize: "clamp(3rem,7vw,6rem)" }}>
          You’re
          <br />
          <span style={{ color: "var(--violet)" }}>in the system.</span>
        </h1>
        <div style={{ background: "rgba(184,115,255,0.08)", border: "1px solid rgba(184,115,255,0.25)", padding: "1.25rem", borderRadius: 12, margin: "1.5rem 0" }}>
          <h3 style={{ marginTop: 0, color: "var(--violet)" }}>Your Login Credentials</h3>
          <div style={{ fontSize: ".95rem", lineHeight: 1.6 }}>
            <div><strong>Email:</strong> {registeredEmail}</div>
            <div><strong>Password:</strong> {usedPassword}</div>
          </div>
        </div>
        <p className="muted" style={{ lineHeight: 1.6 }}>
          Your application is currently pending verification. Once approved by festival staff, your official ILLENIUM ID pass and check-in QR code will be generated automatically.
        </p>
        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
          <Link href="/participant/dashboard" className="btn btn-primary">
            Go to Participant Dashboard ↗
          </Link>
          <Link href="/auth/login" className="btn btn-ghost">
            Login Page
          </Link>
        </div>
      </main>
    );

  return (
    <main className="section" style={{ maxWidth: 900 }}>
      <div className="eyebrow">Participant registration</div>
      <h1 className="display" style={{ fontSize: "clamp(3rem,7vw,6rem)", marginBottom: "2rem" }}>
        Claim your
        <br />
        <span style={{ color: "var(--violet)" }}>place here.</span>
      </h1>
      <div className="panel" style={{ background: "rgba(255,255,255,.04)", borderColor: "var(--line)", color: "white" }}>
        <div style={{ display: "flex", gap: ".45rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          {steps.map((label, index) => (
            <span key={label} className="tag" style={{ opacity: index === step ? 1 : 0.45 }}>
              {String(index + 1).padStart(2, "0")} · {label}
            </span>
          ))}
        </div>

        {step === 0 && (
          <div className="form-grid">
            <label className="field">
              <span>Full name</span>
              <input
                className="input"
                placeholder="e.g. Parth Parmar"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
              />
            </label>
            <label className="field">
              <span>Email address</span>
              <input
                className="input"
                type="email"
                placeholder="parth@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </label>
            <label className="field">
              <span>Phone number</span>
              <input
                className="input"
                placeholder="e.g. 9920290831"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </label>
            <label className="field">
              <span>Account password</span>
              <input
                className="input"
                type="password"
                placeholder="Set password (default: Illenium2026!)"
                value={form.password || ""}
                onChange={(e) => update("password", e.target.value)}
              />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="form-grid">
            <label className="field full">
              <span>Select College</span>
              {colleges.length > 0 ? (
                <select
                  className="select"
                  value={form.collegeId}
                  onChange={(e) => update("collegeId", e.target.value)}
                >
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: "#171725", color: "#fff" }}>
                      {c.name} ({c.short_name})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="input"
                  value={form.collegeId}
                  onChange={(e) => update("collegeId", e.target.value)}
                  placeholder="College Name or ID"
                />
              )}
            </label>
            <label className="field">
              <span>College roll number / PRN</span>
              <input
                className="input"
                placeholder="e.g. 2410244"
                value={form.collegeRollNumber}
                onChange={(e) => update("collegeRollNumber", e.target.value)}
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="form-grid">
            <p className="muted full">Private documents are stored securely in Supabase Storage and never encoded into the QR.</p>
            <label className="field">
              <span>Participant photo</span>
              <input className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
            </label>
            <label className="field">
              <span>College ID photo</span>
              <input className="input" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setCollegeIdFile(e.target.files?.[0] ?? null)} />
            </label>
            <label className="field full">
              <span><input type="checkbox" defaultChecked required /> I confirm the information provided is accurate and belongs to me.</span>
            </label>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="muted" style={{ marginBottom: "1rem" }}>Select the events you wish to participate in:</p>
            {eventsList.length > 0 ? (
              <div style={{ display: "grid", gap: ".75rem", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                {eventsList.map((e) => {
                  const isSelected = form.eventIds.includes(e.id);
                  return (
                    <div
                      key={e.id}
                      onClick={() => toggleEvent(e.id)}
                      style={{
                        padding: "1rem",
                        border: `1px solid ${isSelected ? "var(--violet)" : "var(--line)"}`,
                        borderRadius: 8,
                        background: isSelected ? "rgba(184,115,255,0.12)" : "rgba(255,255,255,0.02)",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: "1rem" }}>{e.name}</div>
                      <div className="muted" style={{ fontSize: ".8rem" }}>{e.category} · {e.venue}</div>
                      <div style={{ marginTop: ".5rem", fontSize: ".75rem", color: isSelected ? "var(--violet)" : "var(--muted)" }}>
                        {isSelected ? "✓ Selected" : "+ Click to select"}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <label className="field">
                <span>Event Selection</span>
                <input
                  className="input"
                  value={form.eventIds.join(",")}
                  onChange={(e) => setForm((old) => ({ ...old, eventIds: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) }))}
                  placeholder="Optional Event IDs"
                />
              </label>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="form-grid">
            <label className="field">
              <span>Emergency contact name</span>
              <input className="input" placeholder="e.g. Anish Parmar" value={form.emergencyName} onChange={(e) => update("emergencyName", e.target.value)} />
            </label>
            <label className="field">
              <span>Emergency contact phone</span>
              <input className="input" placeholder="e.g. 9920290831" value={form.emergencyPhone} onChange={(e) => update("emergencyPhone", e.target.value)} />
            </label>
          </div>
        )}

        {step === 5 && (
          <div>
            <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.25rem", borderRadius: 8, border: "1px solid var(--line)" }}>
              <h3 style={{ marginTop: 0, color: "var(--violet)" }}>Review Registration Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: ".9rem", lineHeight: 1.6 }}>
                <div><strong>Full Name:</strong> {form.fullName || "—"}</div>
                <div><strong>Email:</strong> {form.email || "—"}</div>
                <div><strong>Phone:</strong> {form.phone || "—"}</div>
                <div><strong>College:</strong> {colleges.find(c => c.id === form.collegeId)?.name || form.collegeId || "Atlas SkillTech University"}</div>
                <div><strong>Roll Number:</strong> {form.collegeRollNumber || "—"}</div>
                <div><strong>Emergency Contact:</strong> {form.emergencyName || "—"} ({form.emergencyPhone || "—"})</div>
                <div><strong>Events Selected:</strong> {form.eventIds.length ? `${form.eventIds.length} event(s)` : "None selected"}</div>
              </div>
            </div>
            <p className="muted" style={{ marginTop: "1rem", fontSize: ".8rem" }}>
              By submitting, you agree that festival staff may verify your college identity for event access.
            </p>
          </div>
        )}

        {message && (
          <div style={{ marginTop: "1.5rem", padding: "1rem", borderRadius: 6, background: "rgba(255,105,120,0.12)", border: "1px solid rgba(255,105,120,0.3)", color: "#ff9aa5" }}>
            <div style={{ fontWeight: 700 }}>Submission Notice</div>
            <div>{message}</div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem" }}>
          {step > 0 ? (
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)} disabled={submitting}>
              Back
            </button>
          ) : (
            <span />
          )}
          {step < steps.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
              Continue
            </button>
          ) : (
            <button className="btn btn-primary" onClick={submit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit registration"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
