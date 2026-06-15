create table if not exists ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  feature text not null,
  model text null,
  prompt_tokens integer default 0,
  completion_tokens integer default 0,
  total_tokens integer default 0,
  estimated_cost numeric default 0,
  success boolean default true,
  error_message text null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Index for user-scoped queries
create index if not exists idx_ai_usage_logs_user_id on ai_usage_logs (user_id);

-- Index for feature-scoped queries
create index if not exists idx_ai_usage_logs_feature on ai_usage_logs (feature);

-- Index for time-series queries
create index if not exists idx_ai_usage_logs_created_at on ai_usage_logs (created_at desc);
