import crypto from "node:crypto";

export class TransmitlyError extends Error {
  constructor(status, payload) {
    const message = payload?.error?.message ?? `Request failed (${status})`;
    super(message);
    this.name = "TransmitlyError";
    this.status = status;
    this.code = payload?.error?.code;
    this.details = payload?.error?.details;
    this.payload = payload;
  }
}

/**
 * Minimal, dependency-free client for the Transmitly API.
 *
 *   const tx = new Transmitly({ apiKey: process.env.TRANSMITLY_KEY });
 *   await tx.emails.send({ from: "Notify <notify@mail.acme.com>", to: ["a@example.net"], subject: "Hi", html: "<p>Hi</p>" });
 */
export class Transmitly {
  constructor({ apiKey, baseUrl = "https://transmitly.io", fetchImpl = globalThis.fetch, timeoutMs = 15000 } = {}) {
    if (!apiKey) throw new Error("apiKey is required");
    if (typeof fetchImpl !== "function") throw new Error("global fetch is unavailable; pass fetchImpl");
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;

    this.emails = {
      send: (payload, options = {}) => this.#sendEmail(payload, options),
      get: async (id) => this.#request("GET", `/v1/emails/${encodeURIComponent(id)}`),
    };
    this.messages = {
      list: (params = {}) => this.#request("GET", "/v1/messages", { query: params }),
      get: async (id) => this.#request("GET", `/v1/messages/${encodeURIComponent(id)}`),
      deliveries: async (id) => this.#request("GET", `/v1/messages/${encodeURIComponent(id)}/deliveries`),
    };
    this.domains = {
      list: async () => this.#request("GET", "/v1/domains"),
      create: async (domain) => this.#request("POST", "/v1/domains", { body: { domain } }),
      verify: async (id) => this.#request("POST", `/v1/domains/${encodeURIComponent(id)}/verify`),
      setStatus: async (id, status) => this.#request("POST", `/v1/domains/${encodeURIComponent(id)}/status`, { body: { status } }),
      audit: async (id) => this.#request("GET", `/v1/domains/${encodeURIComponent(id)}/audit`),
      dmarc: async (id) => this.#request("GET", `/v1/domains/${encodeURIComponent(id)}/dmarc`),
      remove: async (id) => this.#request("DELETE", `/v1/domains/${encodeURIComponent(id)}`),
    };
    this.suppressions = {
      list: (params = {}) => this.#request("GET", "/v1/suppressions", { query: params }),
      add: async (input) => this.#request("POST", "/v1/suppressions", { body: input }),
      remove: async (id) => this.#request("DELETE", `/v1/suppressions/${encodeURIComponent(id)}`),
    };
    this.webhooks = {
      list: async () => this.#request("GET", "/v1/webhooks"),
      create: async (input) => this.#request("POST", "/v1/webhooks", { body: input }),
      update: async (id, input) => this.#request("PATCH", `/v1/webhooks/${encodeURIComponent(id)}`, { body: input }),
      remove: async (id) => this.#request("DELETE", `/v1/webhooks/${encodeURIComponent(id)}`),
      attempts: async () => this.#request("GET", "/v1/webhooks/attempts"),
    };
    this.inbound = {
      routes: async () => this.#request("GET", "/v1/inbound/routes"),
      addRoute: async (input) => this.#request("POST", "/v1/inbound/routes", { body: input }),
      updateRoute: async (id, input) => this.#request("PATCH", `/v1/inbound/routes/${encodeURIComponent(id)}`, { body: input }),
      removeRoute: async (id) => this.#request("DELETE", `/v1/inbound/routes/${encodeURIComponent(id)}`),
    };
    this.usage = {
      get: (params = {}) => this.#request("GET", "/v1/usage", { query: params }),
    };
    this.events = {
      list: (params = {}) => this.#request("GET", "/v1/events", { query: params }),
    };
    this.audiences = {
      list: async () => this.#request("GET", "/v1/audiences"),
      create: async (input) => this.#request("POST", "/v1/audiences", { body: input }),
      get: async (id) => this.#request("GET", `/v1/audiences/${encodeURIComponent(id)}`),
      remove: async (id) => this.#request("DELETE", `/v1/audiences/${encodeURIComponent(id)}`),
    };
    this.contacts = {
      list: (params = {}) => this.#request("GET", "/v1/contacts", { query: params }),
      create: async (input) => this.#request("POST", "/v1/contacts", { body: input }),
      get: async (id) => this.#request("GET", `/v1/contacts/${encodeURIComponent(id)}`),
      update: async (id, input) => this.#request("PATCH", `/v1/contacts/${encodeURIComponent(id)}`, { body: input }),
      remove: async (id) => this.#request("DELETE", `/v1/contacts/${encodeURIComponent(id)}`),
      import: async (audienceId, csv) => this.#request("POST", "/v1/contacts/import", { body: { audience_id: audienceId, csv } }),
    };
    this.deliverability = {
      audit: async () => this.#request("GET", "/v1/deliverability/audit"),
      refreshBlocklists: async () => this.#request("POST", "/v1/deliverability/blocklists/refresh", { body: {} }),
    };
    this.mta = {
      nodes: async () => this.#request("GET", "/v1/mta/nodes"),
      updateIP: async (id, input) => this.#request("PATCH", `/v1/mta/ips/${encodeURIComponent(id)}`, { body: input }),
      assignments: {
        list: async () => this.#request("GET", "/v1/mta/assignments"),
        create: async (input) => this.#request("POST", "/v1/mta/assignments", { body: input }),
        remove: async (id) => this.#request("DELETE", `/v1/mta/assignments/${encodeURIComponent(id)}`),
      },
    };
    this.broadcasts = {
      list: async () => this.#request("GET", "/v1/broadcasts"),
      create: async (input) => this.#request("POST", "/v1/broadcasts", { body: input }),
      get: async (id) => this.#request("GET", `/v1/broadcasts/${encodeURIComponent(id)}`),
      update: async (id, input) => this.#request("PATCH", `/v1/broadcasts/${encodeURIComponent(id)}`, { body: input }),
      remove: async (id) => this.#request("DELETE", `/v1/broadcasts/${encodeURIComponent(id)}`),
      send: async (id, input = {}) => this.#request("POST", `/v1/broadcasts/${encodeURIComponent(id)}/send`, { body: input }),
      cancel: async (id) => this.#request("POST", `/v1/broadcasts/${encodeURIComponent(id)}/cancel`, { body: {} }),
    };
    this.templates = {
      list: async () => this.#request("GET", "/v1/templates"),
      create: async (input) => this.#request("POST", "/v1/templates", { body: input }),
      get: async (id) => this.#request("GET", `/v1/templates/${encodeURIComponent(id)}`),
      update: async (id, input) => this.#request("PATCH", `/v1/templates/${encodeURIComponent(id)}`, { body: input }),
      remove: async (id) => this.#request("DELETE", `/v1/templates/${encodeURIComponent(id)}`),
    };
    this.inboxes = {
      list: async () => this.#request("GET", "/v1/inboxes"),
      create: async (input) => this.#request("POST", "/v1/inboxes", { body: input }),
      get: async (id) => this.#request("GET", `/v1/inboxes/${encodeURIComponent(id)}`),
      remove: async (id) => this.#request("DELETE", `/v1/inboxes/${encodeURIComponent(id)}`),
      thread: async (id, threadId) => this.#request("GET", `/v1/inboxes/${encodeURIComponent(id)}/threads/${encodeURIComponent(threadId)}`),
      reply: async (id, threadId, input) => this.#request("POST", `/v1/inboxes/${encodeURIComponent(id)}/threads/${encodeURIComponent(threadId)}/reply`, { body: input }),
      markRead: async (id, threadId) => this.#request("PATCH", `/v1/inboxes/${encodeURIComponent(id)}/threads/${encodeURIComponent(threadId)}`, { body: { read: true } }),
      updateThread: async (id, threadId, input) => this.#request("PATCH", `/v1/inboxes/${encodeURIComponent(id)}/threads/${encodeURIComponent(threadId)}`, { body: input }),
    };
    this.health = async () => this.#request("GET", "/v1/health", { auth: false });
  }

  async #sendEmail(payload, { idempotencyKey } = {}) {
    if (!payload?.from) throw new TypeError("from is required");
    if (!payload?.to) throw new TypeError("to is required");
    if (!payload?.subject) throw new TypeError("subject is required");
    if (!payload?.html && !payload?.text) throw new TypeError("html or text is required");
    const key = idempotencyKey ?? crypto.randomUUID();
    return this.#request("POST", "/v1/emails", { body: payload, headers: { "Idempotency-Key": key } });
  }

  async #request(method, path, { body, headers = {}, query, auth = true } = {}) {
    const url = new URL(this.baseUrl + path);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
      }
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(url, {
        method,
        headers: {
          accept: "application/json",
          ...(body ? { "content-type": "application/json" } : {}),
          ...(auth ? { authorization: `Bearer ${this.apiKey}` } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) throw new TransmitlyError(res.status, data);
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Verify a webhook delivery. Pass the raw request body (not a parsed object),
   * the Transmitly-Signature header and the endpoint signing secret.
   */
  static verifyWebhook(rawBody, signatureHeader, secret, toleranceSeconds = 300) {
    if (!signatureHeader) return false;
    let ts;
    let sig;
    for (const part of signatureHeader.split(",")) {
      const [k, v] = part.trim().split("=");
      if (!v) continue;
      if (k === "t") ts = Number(v);
      else if (k === "v1") sig = v;
    }
    if (!ts || !sig) return false;
    if (toleranceSeconds > 0 && Math.abs(Math.floor(Date.now() / 1000) - ts) > toleranceSeconds) return false;
    const expected = crypto.createHmac("sha256", secret).update(`${ts}.`).update(rawBody).digest("hex");
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
}

export default Transmitly;
