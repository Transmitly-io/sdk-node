# @transmitly/sdk

Dependency-free Node.js client for the Transmitly API. Requires Node 18+ (global `fetch`).

```bash
npm install @transmitly/sdk
```

```js
import { Transmitly } from "@transmitly/sdk";

const tx = new Transmitly({ apiKey: process.env.TRANSMITLY_KEY });

const accepted = await tx.emails.send({
  from: "Notify <notify@mail.acme.com>",
  to: ["ada@example.net"],
  subject: "Your workspace is ready",
  html: "<p>Welcome.</p>",
  tags: { flow: "onboarding" },
});
// { id: "msg_…", status: "accepted", recipients: 1 }
```

`emails.send` generates an idempotency key; retries with the same key return the
original message. Pass `{ idempotencyKey }` to control it yourself.

## Resources

```js
await tx.emails.get(id);
await tx.messages.list({ status: "bounced", limit: 20 });
await tx.messages.deliveries(id);
await tx.domains.list();                 // includes DNS records and plan limits
await tx.domains.create("mail.acme.com");
await tx.domains.verify(domainId);
await tx.suppressions.list();
await tx.suppressions.add({ email: "bounce@example.net", reason: "manual" });
await tx.webhooks.list();
await tx.webhooks.create({ url: "https://api.acme.com/hooks", events: ["email.delivered_to_mx"] });
await tx.inbound.routes();
await tx.usage.get();
await tx.events.list({ limit: 50 });

// Templates and test mode
const { template } = await tx.templates.create({
  name: "Welcome",
  subject: "Welcome, {{name}}",
  html: "<p>Hello {{name}}</p>",
});
await tx.emails.send({
  from: "Notify <notify@mail.acme.com>",
  to: ["ada@example.net"],
  template_id: template.id,
  template_data: { name: "Ada" },
  test_mode: true,
});

// Contacts and audiences
await tx.audiences.create({ name: "Product updates" });
await tx.contacts.import(audienceId, "email,name\nada@example.net,Ada");
await tx.contacts.list({ audience: audienceId, q: "ada" });

// Inboxes
await tx.inboxes.list();
await tx.inboxes.create({ address: "support@mail.acme.com", name: "Support", from_name: "Ada from Support" });
await tx.inboxes.thread(inboxId, threadId);
await tx.inboxes.reply(inboxId, threadId, { text: "Thanks — we are looking into it." });
```

Domain, webhook and inbound management require an API key with the `admin` scope.
Inbound routes accept `forward`, `relay`, `webhook` or `drop`.

## Webhooks

Verify against the **raw** request body and reject old timestamps:

```js
import { Transmitly } from "@transmitly/sdk";

const ok = Transmitly.verifyWebhook(
  rawBody,
  req.headers["transmitly-signature"],
  process.env.TRANSMITLY_WEBHOOK_SECRET,
);
if (!ok) return res.status(400).end();
```

## Errors

Non-2xx responses throw `TransmitlyError` with `status`, `code` and `details`.

## Reference

- OpenAPI: https://transmitly.io/openapi.json
- Docs: https://transmitly.io/docs
