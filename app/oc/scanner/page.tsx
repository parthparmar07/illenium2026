"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { RoleShell } from "@/components/layout/role-shell";

type Result = { status: string; message?: string; participant?: { full_name: string; illenium_id: string; college: string }; checkedInAt?: string };

function ScannerContent() {
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [mode, setMode] = useState<"event_entry" | "campus_entry">(searchParams.get("mode") === "campus_entry" ? "campus_entry" : "event_entry");
  const [eventId] = useState(searchParams.get("event") ?? "");
  const [manual, setManual] = useState("");
  const [activeToken, setActiveToken] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  async function verify(token: string) {
    const clean = token.trim();
    if (!clean) return setError("Enter an ILLENIUM ID or scan a QR code first.");
    setError(""); setActiveToken(clean); setScanning(false);
    const response = await fetch("/api/verification", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: clean, eventId: eventId || undefined }) });
    setResult(await response.json() as Result);
  }
  async function start() {
    setError(""); setResult(null);
    try { const reader = new BrowserMultiFormatReader(); readerRef.current = reader; setScanning(true); await reader.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } } }, videoRef.current!, async (decoded) => { if (decoded) await verify(decoded.getText()); }); }
    catch { setScanning(false); setError("Camera access is blocked or unavailable. Allow camera access or use manual ILLENIUM ID entry."); }
  }
  function stop() { setScanning(false); const stream = videoRef.current?.srcObject as MediaStream | null; stream?.getTracks().forEach((track) => track.stop()); readerRef.current = null; }
  useEffect(() => () => stop(), []);
  async function checkIn() {
    if (!result?.participant) return;
    const response = await fetch("/api/check-ins", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: activeToken || manual, checkInType: mode, eventId: eventId || undefined }) });
    const body = await response.json() as { message?: string; ok?: boolean };
    setResult({ ...result, status: body.ok ? "checked_in" : body.message === "Already checked in." ? "already_checked_in" : "invalid", message: body.message ?? (body.ok ? "Check-in saved." : "Check-in failed.") });
  }
  const valid = result?.status === "valid";
  return <RoleShell role="oc"><div className="scanner-page"><div className="workspace-page-head"><div><div className="workspace-kicker">Fast lane · {mode === "event_entry" ? "Event entry" : "Campus entry"}</div><h1>Scan with confidence.</h1><p className="workspace-subtitle">{eventId ? "This scanner is locked to the assigned event." : "Use campus entry mode, or open a scanner from an assigned event."}</p></div><span className="live-pill"><i /> Ready</span></div><div className="scanner-toolbar"><button className={`button ${mode === "event_entry" ? "button-primary" : "button-secondary"}`} onClick={() => setMode("event_entry")}>Event entry</button><button className={`button ${mode === "campus_entry" ? "button-primary" : "button-secondary"}`} onClick={() => setMode("campus_entry")}>Campus entry</button>{eventId && <span className="scanner-event-lock">Event assignment active</span>}</div><div className="scanner-layout"><section className="scanner-camera-panel"><div className="camera-frame"><video ref={videoRef} muted playsInline /><div className="scan-crosshair" /><div className="scan-hint">Align the participant QR inside the frame</div></div><div className="scanner-actions"><button className="button button-primary" onClick={start}>{scanning ? "Scanning…" : "Start camera"}</button><button className="button button-secondary" onClick={stop}>Stop</button></div>{error && <div className="scan-alert">{error}</div>}</section><aside className="scanner-side"><section className="workspace-panel manual-panel"><div className="workspace-kicker">Fallback</div><h2>Enter an ID</h2><p className="workspace-subtitle">Use this when a camera is unavailable. The server still verifies the participant record.</p><input className="workspace-input" value={manual} onChange={(e) => setManual(e.target.value.toUpperCase())} placeholder="ILL-26-000123" inputMode="text" /><button className="button button-secondary" onClick={() => verify(manual)}>Verify ID</button></section>{result && <section className={`scan-result ${valid || result.status === "checked_in" ? "scan-result-valid" : "scan-result-invalid"}`}><div className="result-status">{result.status === "valid" ? "VALID PARTICIPANT" : result.status === "already_checked_in" ? "ALREADY CHECKED IN" : result.status === "checked_in" ? "CHECKED IN" : result.status.toUpperCase()}</div>{result.participant && <><h2>{result.participant.full_name}</h2><p>{result.participant.illenium_id} · {result.participant.college}</p>{valid && <button className="button button-primary" onClick={checkIn}>Record check-in</button>}</>}{result.message && <p className="workspace-subtitle">{result.message}</p>}</section>}</aside></div></div></RoleShell>;
}

export default function ScannerPage() { return <Suspense fallback={<div className="workspace-content">Loading scanner…</div>}><ScannerContent /></Suspense>; }
