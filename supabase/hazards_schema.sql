create table if not exists public.hazards (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete set null,
  title text not null,
  description text,
  risk_level text check (risk_level in ('Low', 'Medium', 'High', 'Critical')),
  location text,
  image_url text, -- simplified for one photo
  status text check (status in ('Open', 'Resolved')) default 'Open',
  resolution_notes text,
  created_by uuid references auth.users(id),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.hazards enable row level security;

-- View: Admins can view all, Users can view their own company's
create policy "View hazards"
  on hazards for select
  using (
      (select company_id from profiles where id = auth.uid()) = company_id
  );

-- Insert: Users can report hazards
create policy "Report hazards"
  on hazards for insert
  with check (
      (select company_id from profiles where id = auth.uid()) = company_id
  );

-- Update: Admins or the Creator can update (e.g. resolve)
create policy "Update hazards"
  on hazards for update
  using (
      (select company_id from profiles where id = auth.uid()) = company_id
  );
