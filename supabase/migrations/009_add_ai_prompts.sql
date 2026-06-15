-- Create ai_prompts table for admin-managed AI prompt templates
create table if not exists ai_prompts (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  description text null,
  prompt text not null,
  version integer default 1,
  is_active boolean default true,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Index for key lookups
create index if not exists idx_ai_prompts_key on ai_prompts (key);

-- Index for active prompts
create index if not exists idx_ai_prompts_active on ai_prompts (is_active) where is_active = true;
