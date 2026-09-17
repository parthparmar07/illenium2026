import { createHash, randomBytes } from "node:crypto";

export function createOpaqueToken() { return randomBytes(32).toString("base64url"); }
export function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function qrUrl(token: string) { return `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/verify/${encodeURIComponent(token)}`; }
