-- ═════════════════════════════════════════════════════════════════
-- BizPilot AI · 001_initial.sql
-- Initial schema: leads, emails, followups, agent_logs
-- Includes Row Level Security policies scoped to workspace_members
-- ═════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 0. Extensions
-- ─────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";   -- trigram indexes for fuzzy search

-- ─────────────────────────────────────────────────────────────────
-- 1. Helper: get current user's workspaces
--    A single source of truth for RLS policies.
-- ─────────────────────────────────────────────────────────────────
create or replace function public.user_workspace_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id
  from public.workspace_members
  where user_id = auth.uid()
    and accepted_at is not null;
$$;

revoke all on function public.user_workspace_ids() from public;
grant execute on function public.user_workspace_ids() to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 2. Reusable updated_at trigger
-- ─────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────
-- 3. LEADS  (core B2B contact records)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.leads (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null,
  owner_id        uuid references auth.users(id) on delete set null,

  -- Identity
  first_name      text,
  last_name       text,
  full_name       text generated always as (
                    nullif(trim(coalesce(first_name,'') || ' ' || coalesce(last_name,'')), '')
                  ) stored,
  email           citext,
  phone           text,
  title           text,
  seniority       text check (seniority in ('ic','manager','director','vp','cxo','founder','unknown') default 'unknown'),
  department      text,

  -- Company
  company_name    text,
  company_domain  text,
  company_size    text check (company_size in ('1-10','11-50','51-200','201-500','501-1000','1001-5000','5000+')),
  company_industry text,
  company_country text,
  company_city    text,
  company_state   text,
  company_revenue text,

  -- Social
  linkedin_url    text,
  twitter_url     text,
  github_url      text,
  website_url     text,

  -- Enrichment
  photo_url       text,
  enrichment_data jsonb not null default '{}'::jsonb,
  enrichment_source text,
  enriched_at     timestamptz,

  -- Lifecycle
  status          text not null default 'new'
                  check (status in ('new','contacted','engaged','replied','interested','meeting_booked','qualified','unqualified','bounced','unsubscribed','do_not_contact')),
  score           integer check (score between 0 and 100),
  tags            text[] not null default '{}',

  -- Source attribution
  source          text check (source in ('manual','csv_import','apollo','clearbit','prospector','linkedin','api','form','referral','other')),
  source_detail   text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,

  -- Custom fields (extensible)
  custom_fields   jsonb not null default '{}'::jsonb,

  -- Soft delete
  archived_at     timestamptz,

  -- Timestamps
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  last_contacted_at timestamptz,

  -- Constraints
  constraint leads_email_per_workspace_unique
    exclude (workspace_id with =, email with =)
    where (email is not null)
);

create index if not exists leads_workspace_idx         on public.leads (workspace_id);
create index if not exists leads_owner_idx             on public.leads (owner_id);
create index if not exists leads_status_idx            on public.leads (workspace_id, status);
create index if not exists leads_email_idx             on public.leads (workspace_id, email);
create index if not exists leads_company_idx           on public.leads (workspace_id, company_domain);
create index if not exists leads_tags_idx              on public.leads using gin (tags);
create index if not exists leads_custom_fields_idx     on public.leads using gin (custom_fields);
create index if not exists leads_name_trgm_idx         on public.leads using gin (full_name gin_trgm_ops);
create index if not exists leads_company_trgm_idx      on public.leads using gin (company_name gin_trgm_ops);
create index if not exists leads_created_at_idx        on public.leads (workspace_id, created_at desc);

create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- 4. EMAILS  (sent + received messages)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.emails (
  id                  uuid primary key default uuid_generate_v4(),
  workspace_id        uuid not null,
  lead_id             uuid not null references public.leads(id) on delete cascade,
  campaign_id         uuid,
  sequence_step_id    uuid,
  thread_id           uuid,

  direction           text not null check (direction in ('outbound','inbound')),
  status              text not null default 'queued'
                      check (status in ('draft','queued','scheduled','sent','delivered','opened','clicked','replied','bounced','failed','spam','unsubscribed')),

  -- Identity
  from_email          text not null,
  from_name           text,
  to_email            text not null,
  to_name             text,
  cc                  text[],
  bcc                 text[],

  -- Content
  subject             text,
  preview_text        text,
  body_html           text,
  body_text           text,
  body_ai_generated   boolean not null default false,
  body_ai_prompt      text,

  -- Tracking
  message_id          text,                          -- RFC 5322 Message-ID
  in_reply_to         text,
  references          text,
  thread_index        text,

  -- Provider details
  provider            text check (provider in ('mailgun','sendgrid','ses','resend','postmark','smtp')),
  provider_message_id text,
  provider_response   jsonb not null default '{}'::jsonb,

  -- Engagement (for outbound)
  sent_at             timestamptz,
  delivered_at        timestamptz,
  opened_at           timestamptz,
  open_count          integer not null default 0,
  clicked_at          timestamptz,
  click_count         integer not null default 0,
  replied_at          timestamptz,
  bounced_at          timestamptz,
  bounce_type         text check (bounce_type in ('hard','soft','complaint','undetermined')),
  bounce_reason       text,

  -- Classification
  sentiment           text check (sentiment in ('positive','neutral','negative','out_of_office','interested','not_interested')),
  intent              text check (intent in ('meeting_request','pricing_question','demo_request','unsubscribe','out_of_office','referral','objection','other')),

  -- Attachments
  attachments         jsonb not null default '[]'::jsonb,
  has_attachments     boolean not null default false,

  -- Timestamps
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists emails_workspace_idx        on public.emails (workspace_id);
create index if not exists emails_lead_idx             on public.emails (lead_id);
create index if not exists emails_campaign_idx         on public.emails (campaign_id);
create index if not exists emails_thread_idx           on public.emails (thread_id);
create index if not exists emails_status_idx           on public.emails (workspace_id, status);
create index if not exists emails_direction_idx        on public.emails (workspace_id, direction, created_at desc);
create index if not exists emails_to_email_idx         on public.emails (workspace_id, to_email);
create index if not exists emails_sent_at_idx          on public.emails (workspace_id, sent_at desc);
create index if not exists emails_provider_msg_idx     on public.emails (provider_message_id) where provider_message_id is not null;
create index if not exists emails_message_id_idx       on public.emails (message_id) where message_id is not null;

create trigger emails_set_updated_at
before update on public.emails
for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- 5. FOLLOWUPS  (scheduled steps in sequences)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.followups (
  id                  uuid primary key default uuid_generate_v4(),
  workspace_id        uuid not null,
  lead_id             uuid not null references public.leads(id) on delete cascade,
  campaign_id         uuid not null,
  sequence_id         uuid,
  parent_email_id     uuid references public.emails(id) on delete set null,

  -- Step definition
  step_number         integer not null,
  step_type           text not null check (step_type in ('email','linkedin_connect','linkedin_message','phone_task','manual_task','wait','condition','ai_branch','exit')),
  step_name           text,

  -- Scheduling
  scheduled_for       timestamptz not null,
  scheduled_tz        text default 'UTC',
  send_window_start   time,
  send_window_end     time,
  send_on_days        smallint[] default '{1,2,3,4,5}', -- Mon-Fri (0=Sun)

  -- Execution state
  status              text not null default 'pending'
                      check (status in ('pending','queued','in_progress','sent','skipped','failed','cancelled','paused')),
  attempts            integer not null default 0,
  max_attempts        integer not null default 3,
  last_attempt_at     timestamptz,
  next_attempt_at     timestamptz,
  completed_at        timestamptz,
  failed_at           timestamptz,
  failure_reason      text,

  -- Content (snapshotted at scheduling time so edits don't break in-flight steps)
  subject             text,
  body_html           text,
  body_text           text,
  variables           jsonb not null default '{}'::jsonb,

  -- Personalization
  ai_personalized     boolean not null default false,
  personalization_data jsonb,

  -- Conditions / branching
  skip_if             jsonb,             -- { "if": "replied", "then": "skip" }
  only_if             jsonb,             -- { "if": "opened", "then": "send" }

  -- Linked execution
  email_id            uuid references public.emails(id) on delete set null,
  task_assignee_id    uuid references auth.users(id) on delete set null,

  -- Timestamps
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Prevent duplicate step numbers within a lead+campaign
  constraint followups_unique_step_per_lead_campaign
    unique (lead_id, campaign_id, step_number)
);

create index if not exists followups_workspace_idx     on public.followups (workspace_id);
create index if not exists followups_lead_idx          on public.followups (lead_id);
create index if not exists followups_campaign_idx      on public.followups (campaign_id);
create index if not exists followups_status_idx        on public.followups (workspace_id, status);
create index if not exists followups_scheduled_idx     on public.followups (status, scheduled_for)
                                                      where status in ('pending','queued','paused');
create index if not exists followups_next_attempt_idx  on public.followups (next_attempt_at)
                                                      where status in ('pending','queued');
create index if not exists followups_assignee_idx      on public.followups (task_assignee_id)
                                                      where task_assignee_id is not null;
create index if not exists followups_parent_email_idx  on public.followups (parent_email_id)
                                                      where parent_email_id is not null;

create trigger followups_set_updated_at
before update on public.followups
for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- 6. AGENT_LOGS  (AI agent activity / observability)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.agent_logs (
  id                  uuid primary key default uuid_generate_v4(),
  workspace_id        uuid not null,
  user_id             uuid references auth.users(id) on delete set null,

  -- Agent identity
  agent_name          text not null,                            -- e.g. 'sequence_writer','lead_enricher','reply_classifier','warmup_scheduler'
  agent_version       text,                                     -- e.g. 'gpt-4o@2024-08', 'internal-2.1'
  run_id              uuid not null default uuid_generate_v4(), -- groups steps inside one agent execution

  -- Inputs / outputs
  task                text not null,                            -- 'generate_email','classify_reply','score_lead','summarize_thread'
  input               jsonb not null default '{}'::jsonb,
  output              jsonb not null default '{}'::jsonb,
  intermediate_steps  jsonb not null default '[]'::jsonb,

  -- Linked entities (any of these may be set)
  lead_id             uuid references public.leads(id) on delete set null,
  email_id            uuid references public.emails(id) on delete set null,
  campaign_id         uuid,
  followup_id         uuid references public.followups(id) on delete set null,

  -- Model usage
  model               text,                                     -- 'gpt-4o','claude-3-5-sonnet','internal'
  prompt_tokens       integer,
  completion_tokens   integer,
  total_tokens        integer,
  cost_cents          numeric(10,4),

  -- Status
  status              text not null default 'running'
                      check (status in ('running','succeeded','failed','cancelled','timeout','rate_limited')),
  error_code          text,
  error_message       text,
  retry_count         integer not null default 0,

  -- Latency
  started_at          timestamptz not null default now(),
  completed_at        timestamptz,
  duration_ms         integer generated always as (
                        extract(epoch from (completed_at - started_at)) * 1000
                      ) stored,

  -- Tracing
  trace_id            text,
  span_id             text,
  parent_span_id      text,

  -- Metadata
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists agent_logs_workspace_idx     on public.agent_logs (workspace_id);
create index if not exists agent_logs_user_idx          on public.agent_logs (user_id);
create index if not exists agent_logs_agent_idx         on public.agent_logs (workspace_id, agent_name, created_at desc);
create index if not exists agent_logs_status_idx        on public.agent_logs (workspace_id, status);
create index if not exists agent_logs_run_idx           on public.agent_logs (run_id);
create index if not exists agent_logs_lead_idx          on public.agent_logs (lead_id) where lead_id is not null;
create index if not exists agent_logs_email_idx         on public.agent_logs (email_id) where email_id is not null;
create index if not exists agent_logs_followup_idx      on public.agent_logs (followup_id) where followup_id is not null;
create index if not exists agent_logs_task_idx          on public.agent_logs (workspace_id, task, created_at desc);
create index if not exists agent_logs_created_at_idx    on public.agent_logs (workspace_id, created_at desc);
create index if not exists agent_logs_trace_idx         on public.agent_logs (trace_id) where trace_id is not null;
create index if not exists agent_logs_input_idx         on public.agent_logs using gin (input);
create index if not exists agent_logs_output_idx        on public.agent_logs using gin (output);

-- ═════════════════════════════════════════════════════════════════
-- 7. ROW LEVEL SECURITY
-- ═════════════════════════════════════════════════════════════════

alter table public.leads       enable row level security;
alter table public.emails      enable row level security;
alter table public.followups   enable row level security;
alter table public.agent_logs  enable row level security;

-- Force RLS even for table owners (defense-in-depth)
alter table public.leads       force row level security;
alter table public.emails      force row level security;
alter table public.followups   force row level security;
alter table public.agent_logs  force row level security;

-- ─────────────── LEADS ───────────────
drop policy if exists "leads_select_own_workspace"  on public.leads;
drop policy if exists "leads_insert_own_workspace"  on public.leads;
drop policy if exists "leads_update_own_workspace"  on public.leads;
drop policy if exists "leads_delete_own_workspace"  on public.leads;

create policy "leads_select_own_workspace"
  on public.leads for select
  to authenticated
  using (workspace_id in (select public.user_workspace_ids()));

create policy "leads_insert_own_workspace"
  on public.leads for insert
  to authenticated
  with check (workspace_id in (select public.user_workspace_ids()));

create policy "leads_update_own_workspace"
  on public.leads for update
  to authenticated
  using       (workspace_id in (select public.user_workspace_ids()))
  with check  (workspace_id in (select public.user_workspace_ids()));

create policy "leads_delete_own_workspace"
  on public.leads for delete
  to authenticated
  using (workspace_id in (select public.user_workspace_ids()));

-- ─────────────── EMAILS ───────────────
drop policy if exists "emails_select_own_workspace"  on public.emails;
drop policy if exists "emails_insert_own_workspace"  on public.emails;
drop policy if exists "emails_update_own_workspace"  on public.emails;
drop policy if exists "emails_delete_own_workspace"  on public.emails;

create policy "emails_select_own_workspace"
  on public.emails for select
  to authenticated
  using (workspace_id in (select public.user_workspace_ids()));

create policy "emails_insert_own_workspace"
  on public.emails for insert
  to authenticated
  with check (workspace_id in (select public.user_workspace_ids()));

create policy "emails_update_own_workspace"
  on public.emails for update
  to authenticated
  using       (workspace_id in (select public.user_workspace_ids()))
  with check  (workspace_id in (select public.user_workspace_ids()));

create policy "emails_delete_own_workspace"
  on public.emails for delete
  to authenticated
  using (workspace_id in (select public.user_workspace_ids()));

-- ─────────────── FOLLOWUPS ───────────────
drop policy if exists "followups_select_own_workspace" on public.followups;
drop policy if exists "followups_insert_own_workspace" on public.followups;
drop policy if exists "followups_update_own_workspace" on public.followups;
drop policy if exists "followups_delete_own_workspace" on public.followups;

create policy "followups_select_own_workspace"
  on public.followups for select
  to authenticated
  using (workspace_id in (select public.user_workspace_ids()));

create policy "followups_insert_own_workspace"
  on public.followups for insert
  to authenticated
  with check (workspace_id in (select public.user_workspace_ids()));

create policy "followups_update_own_workspace"
  on public.followups for update
  to authenticated
  using       (workspace_id in (select public.user_workspace_ids()))
  with check  (workspace_id in (select public.user_workspace_ids()));

create policy "followups_delete_own_workspace"
  on public.followups for delete
  to authenticated
  using (workspace_id in (select public.user_workspace_ids()));

-- ─────────────── AGENT_LOGS ───────────────
drop policy if exists "agent_logs_select_own_workspace" on public.agent_logs;
drop policy if exists "agent_logs_insert_own_workspace" on public.agent_logs;
drop policy if exists "agent_logs_update_own_workspace" on public.agent_logs;
drop policy if exists "agent_logs_delete_own_workspace" on public.agent_logs;

create policy "agent_logs_select_own_workspace"
  on public.agent_logs for select
  to authenticated
  using (workspace_id in (select public.user_workspace_ids()));

create policy "agent_logs_insert_own_workspace"
  on public.agent_logs for insert
  to authenticated
  with check (workspace_id in (select public.user_workspace_ids()));

-- Agent logs are append-mostly. Members of a workspace may only UPDATE logs
-- in non-terminal states (e.g. status='running') to mark them completed/failed.
create policy "agent_logs_update_own_workspace"
  on public.agent_logs for update
  to authenticated
  using       (workspace_id in (select public.user_workspace_ids()))
  with check  (workspace_id in (select public.user_workspace_ids()));

-- Hard deletes are reserved for workspace owners via service-role only.
create policy "agent_logs_delete_own_workspace"
  on public.agent_logs for delete
  to authenticated
  using (workspace_id in (select public.user_workspace_ids()));

-- ═════════════════════════════════════════════════════════════════
-- 8. Realtime subscriptions (Postgres → WebSocket broadcast)
-- ═════════════════════════════════════════════════════════════════
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'leads'
  ) then
    alter publication supabase_realtime add table public.leads;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'emails'
  ) then
    alter publication supabase_realtime add table public.emails;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'followups'
  ) then
    alter publication supabase_realtime add table public.followups;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'agent_logs'
  ) then
    alter publication supabase_realtime add table public.agent_logs;
  end if;
end $$;

-- ═════════════════════════════════════════════════════════════════
-- 9. Convenience view: lead engagement summary
-- ═════════════════════════════════════════════════════════════════
create or replace view public.v_lead_engagement as
select
  l.id as lead_id,
  l.workspace_id,
  l.email,
  l.full_name,
  l.company_name,
  l.status,
  count(e.id) filter (where e.direction = 'outbound') as emails_sent,
  count(e.id) filter (where e.direction = 'inbound')  as emails_received,
  count(e.id) filter (where e.opened_at is not null)  as opens,
  count(e.id) filter (where e.clicked_at is not null) as clicks,
  count(e.id) filter (where e.replied_at is not null) as replies,
  max(e.sent_at)    as last_sent_at,
  max(e.replied_at) as last_reply_at,
  l.last_contacted_at,
  l.created_at
from public.leads l
left join public.emails e on e.lead_id = l.id
group by l.id;

-- ═════════════════════════════════════════════════════════════════
-- End of 001_initial.sql
-- ═════════════════════════════════════════════════════════════════
