export type DeliveryStatus =
  | "queued"
  | "sending"
  | "delivered"
  | "deferred"
  | "bounced"
  | "complained"
  | "suppressed"
  | "failed"
  | "cancelled";

export interface EmailInput {
  from: string;
  to: string | string[];
  /** Optional Reply-To address; display name allowed. Prefer this over a Reply-To header. */
  reply_to?: string;
  subject: string;
  html?: string;
  text?: string;
  stream?: "transactional" | "marketing";
  tags?: Record<string, string>;
  headers?: Record<string, string>;
  template_id?: string;
  template_data?: Record<string, string>;
  test_mode?: boolean;
}

export interface EmailAccepted {
  id: string;
  status: "accepted";
  recipients: number;
  warning?: string;
}

export interface Delivery {
  id: string;
  recipient: string;
  status: DeliveryStatus;
  attempts: number;
  provider_id: string;
  mx_host: string;
  smtp_code: number;
  enhanced_code: string;
  last_error: string;
  delivered_at: string | null;
}

export interface Message {
  id: string;
  stream: string;
  from: string;
  subject: string;
  status: string;
  recipient_count: number;
  created_at: string;
}

export interface SuppressionInput {
  email: string;
  reason?: "manual" | "unsubscribe" | "complaint" | "hard_bounce" | "invalid";
  stream?: string;
  note?: string;
}

export interface WebhookInput {
  url: string;
  events: string[];
  description?: string;
  domain_ids?: string[];
}

export interface InboundRouteInput {
  address: string;
  action: "forward" | "relay" | "webhook" | "drop";
  destination?: string;
  note?: string;
}

export interface TemplateInput {
  name: string;
  subject?: string;
  html?: string;
  text?: string;
}

export interface InboxInput {
  address: string;
  name?: string;
  from_name?: string;
}

export interface InboxReplyInput {
  html?: string;
  text?: string;
  from_name?: string;
}

export interface InboxThreadUpdate {
  read?: boolean;
  status?: "open" | "archived";
  assignee_id?: string;
  labels?: string[];
}

export interface Plan {
  id: string;
  name: string;
  monthly_messages: number;
  daily_messages: number;
  max_domains: number;
  max_recipients_per_message: number;
  price_monthly: number;
}

export class TransmitlyError extends Error {
  status: number;
  code?: string;
  details?: Record<string, unknown>;
  payload: unknown;
}

export class Transmitly {
  constructor(options: { apiKey: string; baseUrl?: string; fetchImpl?: typeof fetch; timeoutMs?: number });

  emails: {
    send(input: EmailInput, options?: { idempotencyKey?: string }): Promise<EmailAccepted>;
    get(id: string): Promise<{ message: Message; deliveries: Delivery[] }>;
  };
  messages: {
    list(params?: { status?: string; stream?: string; q?: string; limit?: number; offset?: number }): Promise<{
      messages: Message[];
      total: number;
    }>;
    get(id: string): Promise<{ message: Message; deliveries: Delivery[] }>;
    deliveries(id: string): Promise<{ deliveries: Delivery[] }>;
  };
  domains: {
    list(): Promise<{ domains: unknown[]; plan: Plan; domain_count: number }>;
    create(domain: string): Promise<unknown>;
    verify(id: string): Promise<unknown>;
    setStatus(id: string, status: "ACTIVE" | "SUSPENDED" | "PENDING"): Promise<unknown>;
    remove(id: string): Promise<unknown>;
  };
  suppressions: {
    list(params?: { limit?: number; offset?: number }): Promise<{ suppressions: unknown[]; total: number }>;
    add(input: SuppressionInput): Promise<unknown>;
    remove(id: string): Promise<unknown>;
  };
  webhooks: {
    list(): Promise<{ webhooks: unknown[] }>;
    create(input: WebhookInput): Promise<{ webhook: unknown; secret: string }>;
    update(id: string, input: Partial<WebhookInput>): Promise<unknown>;
    remove(id: string): Promise<unknown>;
    attempts(): Promise<unknown>;
  };
  inbound: {
    routes(): Promise<unknown>;
    addRoute(input: InboundRouteInput): Promise<unknown>;
    updateRoute(id: string, input: Partial<InboundRouteInput>): Promise<unknown>;
    removeRoute(id: string): Promise<unknown>;
  };
  usage: { get(params?: { days?: number }): Promise<unknown> };
  events: { list(params?: { limit?: number }): Promise<unknown> };
  templates: {
    list(): Promise<{ templates: unknown[] }>;
    create(input: TemplateInput): Promise<{ template: unknown }>;
    get(id: string): Promise<{ template: unknown }>;
    update(id: string, input: TemplateInput): Promise<{ template: unknown }>;
    remove(id: string): Promise<unknown>;
  };
  inboxes: {
    list(): Promise<{ inboxes: unknown[] }>;
    create(input: InboxInput): Promise<{ inbox: unknown }>;
    get(id: string): Promise<unknown>;
    remove(id: string): Promise<unknown>;
    thread(id: string, threadId: string): Promise<unknown>;
    reply(id: string, threadId: string, input: InboxReplyInput): Promise<{ message: unknown }>;
    markRead(id: string, threadId: string): Promise<unknown>;
    updateThread(id: string, threadId: string, input: InboxThreadUpdate): Promise<unknown>;
  };
  health(): Promise<unknown>;

  static verifyWebhook(rawBody: string | Buffer, signatureHeader: string, secret: string, toleranceSeconds?: number): boolean;
}

export default Transmitly;
