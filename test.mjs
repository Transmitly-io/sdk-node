import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import crypto from "node:crypto";
import { Transmitly, TransmitlyError } from "./index.js";

async function withServer(handler, fn) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("sends an email with idempotency and returns acceptance", async () => {
  let seen;
  await withServer(async (req, res) => {
    let body = "";
    for await (const part of req) body += part;
    seen = { method: req.method, url: req.url, auth: req.headers.authorization, key: req.headers["idempotency-key"], body: JSON.parse(body) };
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ id: "msg_1", status: "accepted", recipients: 1 }));
  }, async (baseUrl) => {
    const tx = new Transmitly({ apiKey: "txk_test", baseUrl });
    const out = await tx.emails.send({ from: "a@example.com", to: "b@example.net", subject: "Hi", text: "hello" }, { idempotencyKey: "idem-1" });
    assert.equal(out.id, "msg_1");
  });
  assert.equal(seen.method, "POST");
  assert.equal(seen.url, "/v1/emails");
  assert.equal(seen.auth, "Bearer txk_test");
  assert.equal(seen.key, "idem-1");
  assert.deepEqual(seen.body.to, "b@example.net");
});

test("surfaces API errors with status and code", async () => {
  await withServer((req, res) => {
    res.statusCode = 403;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: { code: "insufficient_scope", message: "admin required" } }));
  }, async (baseUrl) => {
    const tx = new Transmitly({ apiKey: "txk_test", baseUrl });
    await assert.rejects(() => tx.inbound.addRoute({ address: "a@b.com", action: "drop" }), (err) => {
      assert.ok(err instanceof TransmitlyError);
      assert.equal(err.status, 403);
      assert.equal(err.code, "insufficient_scope");
      return true;
    });
  });
});

test("serialises query parameters and lists messages", async () => {
  let seenUrl;
  await withServer((req, res) => {
    seenUrl = req.url;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ messages: [], total: 0 }));
  }, async (baseUrl) => {
    const tx = new Transmitly({ apiKey: "txk_test", baseUrl });
    const out = await tx.messages.list({ status: "bounced", limit: 20 });
    assert.equal(out.total, 0);
  });
  assert.equal(seenUrl, "/v1/messages?status=bounced&limit=20");
});

test("verifies webhook signatures and rejects tampering and replay", () => {
  const secret = "whsec_test";
  const body = JSON.stringify({ id: "evt_1" });
  const ts = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac("sha256", secret).update(`${ts}.`).update(body).digest("hex");
  assert.equal(Transmitly.verifyWebhook(body, `t=${ts},v1=${sig}`, secret), true);
  assert.equal(Transmitly.verifyWebhook(body + "x", `t=${ts},v1=${sig}`, secret), false);
  const old = ts - 3600;
  const oldSig = crypto.createHmac("sha256", secret).update(`${old}.`).update(body).digest("hex");
  assert.equal(Transmitly.verifyWebhook(body, `t=${old},v1=${oldSig}`, secret), false);
});

test("validates required send fields locally", async () => {
  const tx = new Transmitly({ apiKey: "txk_test", baseUrl: "http://127.0.0.1:1" });
  await assert.rejects(() => tx.emails.send({ from: "a@example.com", to: "b@example.net", subject: "Hi" }), /html or text/);
});
