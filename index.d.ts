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
  source: string;
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

export interface AudienceInput { name: string; description?: string }
export interface ContactInput {
  email: string;
  name?: string;
  audience_id?: string;
  attributes?: Record<string, string>;
}

export type BroadcastStatus = "draft" | "scheduled" | "sending" | "sent" | "cancelled" | "failed";

export interface SendingIP {
  id: string;
  node_id: string;
  pool_id: string;
  ip: string;
  hostname: string;
  expected_ptr: string;
  provider: string;
  ptr_verified: boolean;
  spf_verified: boolean;
  status: "active" | "warming" | "paused" | "quarantined";
  pool_weight: number;
  attempts_24h: number;
  deferred_24h: number;
  last_checked_at: string | null;
  checks: Record<string, unknown>;
  reputation: Record<string, unknown>;
}

export interface DedicatedEligibility {
  eligible: boolean;
  reasons: string[];
  plan: string;
  plan_name: string;
  allowance: number;
  assignments: number;
  available_ips: number;
  monthly_volume: number;
  minimum_volume: number;
  org_age_days: number;
  minimum_age_days: number;
  bounce_rate: number;
  complaint_rate: number;
  active_domains: number;
  pending_request: boolean;
  billing_configured: boolean;
  subscription_ready: boolean;
}

export interface DedicatedIPRequest {
  id: string;
  org_id: string;
  org_name: string;
  stream: "transactional" | "marketing";
  status: "pending" | "approved" | "rejected" | "cancelled";
  reason: string;
  assignment_id: string;
  created_at: string;
  reviewed_at: string | null;
}

export type DedicatedAssignmentStatus = "warming" | "active" | "paused" | "released";

export interface DedicatedAssignment {
  id: string;
  sending_ip_id: string;
  ip: string;
  hostname: string;
  node_id: string;
  node_name: string;
  endpoint: string;
  source_name: string;
  org_id: string;
  org_name: string;
  stream: "transactional" | "marketing";
  status: DedicatedAssignmentStatus;
  warmup_started_at: string;
  warmup_days: number;
  warmup_day: number;
  daily_limit: number;
  sent_today: number;
  last_reset: string;
  assigned_at: string;
  released_at: string | null;
  created_at: string;
  sent_24h: number;
  delivered_24h: number;
  bounced_24h: number;
  complained_24h: number;
}

export interface MTANode {
  id: string;
  name: string;
  hostname: string;
  provider: string;
  endpoint: string;
  enabled: boolean;
  status: "ok" | "degraded" | "unreachable" | "unknown" | "disabled";
  ips: SendingIP[];
  created_at: string;
  updated_at: string;
}

export interface BroadcastInput {
  name: string;
  from: string;
  audience_id?: string;
  template_id?: string;
  from_name?: string;
  subject?: string;
  html?: string;
  text?: string;
  track_opens?: boolean;
  track_clicks?: boolean;
  variant_b_subject?: string;
  variant_b_html?: string;
  variant_b_text?: string;
  variant_split_percent?: number;
  variant_c_subject?: string;
  variant_c_html?: string;
  variant_c_text?: string;
  variant_c_split_percent?: number;
  segment_id?: string;
  topic?: string;
  winner_enabled?: boolean;
  winner_metric?: "open" | "click";
  winner_wait_minutes?: number;
  winner_test_percent?: number;
}

export interface StepCondition {
  attribute_key?: string;
  attribute_value?: string;
  opened_within_days?: number;
  clicked_within_days?: number;
}

export interface AutomationStep {
  id?: string;
  position?: number;
  kind: "wait" | "send" | "route";
  delay_minutes: number;
  subject?: string;
  html?: string;
  text?: string;
  template_id?: string;
  condition?: StepCondition;
  on_match_automation_id?: string;
  on_miss_automation_id?: string;
}

export interface Automation {
  id: string;
  org_id: string;
  name: string;
  audience_id: string;
  audience_name: string;
  from_email: string;
  from_name: string;
  topic: string;
  trigger: "audience_join" | "link_clicked" | "contact_updated" | "inbound_email" | "inbound_route";
  trigger_url: string;
  status: "draft" | "active" | "paused";
  steps: AutomationStep[];
  enrolled: number;
  active: number;
  completed: number;
  failed: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationInput {
  name: string;
  audience_id: string;
  from: string;
  from_name?: string;
  topic?: string;
  trigger?: "audience_join" | "link_clicked" | "contact_updated" | "inbound_email" | "inbound_route";
  trigger_url?: string;
  steps: AutomationStep[];
}

export interface SegmentFilters {
  attributes?: Record<string, string>;
  source?: string;
  opened_within_days?: number;
  clicked_within_days?: number;
  include_unsubscribed?: boolean;
}

export interface Audience {
  id: string;
  org_id: string;
  name: string;
  description: string;
  double_opt_in: boolean;
  confirmation_from: string;
  contacts: number;
  created_at: string;
  updated_at: string;
}

export interface Segment {
  id: string;
  org_id: string;
  name: string;
  description: string;
  audience_id: string;
  audience_name: string;
  filters: SegmentFilters;
  contacts: number;
  created_at: string;
  updated_at: string;
}

export interface ContactTopic {
  topic: string;
  subscribed: boolean;
  updated_at: string | null;
}

export interface BroadcastVariantAnalytics {
  variant: "a" | "b";
  recipients: number;
  delivered: number;
  bounced: number;
  opens: number;
  unique_opens: number;
  clicks: number;
  unique_clicks: number;
}

export interface BroadcastRecipient {
  id: string;
  email: string;
  status: "pending" | "processing" | "queued" | "skipped" | "failed";
  variant: "a" | "b";
  phase: "send" | "test" | "remainder";
  message_id: string;
  error: string;
  updated_at: string;
}

export interface Broadcast {
  id: string;
  name: string;
  audience_id: string;
  audience_name: string;
  segment_id: string;
  segment_name: string;
  topic: string;
  template_id: string;
  from_email: string;
  from_name: string;
  subject: string;
  status: BroadcastStatus;
  track_opens: boolean;
  track_clicks: boolean;
  variant_b_subject: string;
  variant_b_html: string;
  variant_b_text: string;
  variant_split_percent: number;
  variant_c_subject: string;
  variant_c_html: string;
  variant_c_text: string;
  variant_c_split_percent: number;
  winner_enabled: boolean;
  winner_metric: "open" | "click";
  winner_wait_minutes: number;
  winner_test_percent: number;
  winner_variant: "" | "a" | "b";
  winner_selected_at: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  recipients: number;
  queued: number;
  skipped: number;
  failed: number;
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
    audit(id: string): Promise<unknown>;
    dmarc(id: string): Promise<unknown>;
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
  audiences: {
    list(): Promise<{ audiences: unknown[] }>;
    create(input: AudienceInput): Promise<{ audience: unknown }>;
    get(id: string): Promise<{ audience: unknown }>;
    remove(id: string): Promise<unknown>;
  };
  contacts: {
    list(params?: { audience?: string; q?: string; limit?: number; offset?: number }): Promise<{ contacts: unknown[]; total: number }>;
    create(input: ContactInput): Promise<{ contact: unknown }>;
    get(id: string): Promise<{ contact: unknown }>;
    update(id: string, input: Partial<ContactInput> & { unsubscribed?: boolean }): Promise<{ contact: unknown }>;
    remove(id: string): Promise<unknown>;
    import(audienceId: string, csv: string): Promise<{ imported: number; skipped: number }>;
  };
  dedicatedIPs: {
    get(): Promise<{ eligibility: DedicatedEligibility; assignments: DedicatedAssignment[]; requests: DedicatedIPRequest[] }>;
    request(input: { stream?: "transactional" | "marketing"; reason?: string }): Promise<{ request: DedicatedIPRequest }>;
  };
  deliverability: {
    audit(): Promise<unknown>;
    refreshBlocklists(): Promise<unknown>;
  };
  mta: {
    nodes(): Promise<{ nodes: MTANode[]; checks: unknown; heartbeats: unknown; ok: boolean; checked_at: string }>;
    updateIP(id: string, input: { pool_weight?: number; status?: "active" | "warming" | "paused" | "quarantined" }): Promise<{ ip: SendingIP }>;
    assignments: {
      list(): Promise<{ assignments: DedicatedAssignment[] }>;
      create(input: { sending_ip_id: string; stream?: "transactional" | "marketing"; warmup_days?: number }): Promise<{ assignment: DedicatedAssignment }>;
      remove(id: string): Promise<unknown>;
    };
  };
  broadcasts: {
    list(): Promise<{ broadcasts: Broadcast[] }>;
    create(input: BroadcastInput): Promise<{ broadcast: Broadcast }>;
    get(id: string): Promise<{ broadcast: Broadcast; recipients: BroadcastRecipient[]; analytics: unknown }>;
    update(id: string, input: BroadcastInput): Promise<{ broadcast: Broadcast }>;
    remove(id: string): Promise<unknown>;
    send(id: string, input?: { scheduled_at?: string }): Promise<{ broadcast: Broadcast }>;
    test(id: string, to: string): Promise<{ id: string; status: string; to: string }>;
    cancel(id: string): Promise<unknown>;
  };
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
