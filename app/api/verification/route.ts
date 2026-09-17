import { NextResponse } from "next/server";
import { verifyQrToken } from "@/services/verification-service";

export async function POST(request: Request) {
  try { const body = await request.json() as { token?: string; illeniumId?: string; eventId?: string }; const value = body.token ?? body.illeniumId; if (!value) return NextResponse.json({ message: "Token required." }, { status: 400 }); return NextResponse.json(await verifyQrToken(value, body.eventId)); }
  catch { return NextResponse.json({ message: "Verification service unavailable." }, { status: 500 }); }
}
