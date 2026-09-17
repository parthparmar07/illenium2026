import assert from "node:assert/strict";
import test from "node:test";
import { createOpaqueToken, hashToken, qrUrl } from "../../lib/qr/token.ts";

test("opaque QR tokens are random and never equal their hash", () => {
  const first = createOpaqueToken(); const second = createOpaqueToken();
  assert.notEqual(first, second); assert.notEqual(first, hashToken(first)); assert.match(qrUrl(first), /\/verify\//);
});
