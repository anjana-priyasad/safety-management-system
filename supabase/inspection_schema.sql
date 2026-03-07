-- 1. Inspection Templates Table
create table if not exists public.inspection_templates (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  items_json jsonb not null default '[]'::jsonb, -- Stores array of questions: { id, text, type, options? }
  company_id uuid references public.companies(id) on delete set null, -- Optional ref if companies table exists
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Inspection Runs Table
create table if not exists public.inspection_runs (
  id uuid default gen_random_uuid() primary key,
  template_id uuid references public.inspection_templates(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  status text check (status in ('in-progress', 'completed')) default 'in-progress',
  results_json jsonb default '{}'::jsonb, -- Stores answers: { questionId: answer }
  submitted_at timestamp with time zone,
  company_id uuid, -- For faster filtering by company
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS
alter table public.inspection_templates enable row level security;
alter table public.inspection_runs enable row level security;

-- 4. Policies for Templates

-- View: Admins and Users in the same company can view templates
create policy "View templates"
  on inspection_templates for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and (
         -- Match by company_id if present in profiles and template
         (profiles.company_id is not null and profiles.company_id = inspection_templates.company_id)
         or 
         -- Or created by specific user (fallback)
         created_by = auth.uid()
      )
    )
  );

-- Create/Edit: Only Admins
create policy "Manage templates"
  on inspection_templates for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
      and (
         (profiles.company_id is not null and profiles.company_id = inspection_templates.company_id)
         or created_by = auth.uid()
      )
    )
  );


-- 5. Policies for Runs

-- View: functionality for both admins and users
-- Users see their own runs. Admins see all runs for company.
create policy "View runs"
  on inspection_runs for select
  using (
    -- User is owner
    auth.uid() = user_id
    or
    -- User is Admin of same company
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
      and profiles.company_id = inspection_runs.company_id
    )
  );

-- Insert: Authenticated users can start inspections
create policy "Create runs"
  on inspection_runs for insert
  with check ( auth.uid() = user_id );

-- Update: Users can update their own runs (e.g. saving progress)
create policy "Update own runs"
  on inspection_runs for update
  using ( auth.uid() = user_id );

-- 6. Helper Function to set company_id on Template/Run creation (optional but recommended)
--    This assumes the client sends it, or we can use a trigger. 
--    For simplicity, we rely on the client sending correct company_id or a trigger similar to profiles.
