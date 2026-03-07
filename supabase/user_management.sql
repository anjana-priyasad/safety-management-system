-- 1. Update Profiles Table
-- Ensure company_id exists
alter table public.profiles 
add column if not exists company_id uuid;

-- Update role check constraint
alter table public.profiles 
drop constraint if exists profiles_role_check;

alter table public.profiles 
add constraint profiles_role_check 
check (role in ('admin', 'safety_officer', 'employee'));

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Profiles are viewable by everyone" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Admins can update all profiles" on profiles;
drop policy if exists "Admins can delete profiles" on profiles;
drop policy if exists "Admins view company profiles" on profiles;
drop policy if exists "Admins update company profiles" on profiles;
drop policy if exists "Admins delete company profiles" on profiles;

-- 3. Create RLS Policies w/ Company Isolation

-- View: Users can see themselves OR Admins can see all users in their company
create policy "View profiles"
  on profiles for select
  using ( 
    auth.uid() = id 
    or 
    exists (
      select 1 from profiles viewer
      where viewer.id = auth.uid() 
      and viewer.role = 'admin' 
      and viewer.company_id = profiles.company_id
    )
  );

-- Update: Users can update own data (e.g. avatar) OR Admins can update users in their company
create policy "Update profiles"
  on profiles for update
  using ( 
    auth.uid() = id 
    or 
    exists (
      select 1 from profiles viewer
      where viewer.id = auth.uid() 
      and viewer.role = 'admin' 
      and viewer.company_id = profiles.company_id
    )
  );

-- Delete: Only Admins can delete users in their company
create policy "Delete profiles"
  on profiles for delete
  using (
    exists (
      select 1 from profiles viewer
      where viewer.id = auth.uid() 
      and viewer.role = 'admin' 
      and viewer.company_id = profiles.company_id
    )
  );

-- Insert: Users can insert their own profile (handled by trigger usually)
create policy "Insert own profile"
  on profiles for insert
  with check ( auth.uid() = id );

-- 4. Trigger for New Users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, company_id)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    coalesce(new.raw_user_meta_data->>'role', 'employee'), -- Default to employee
    (new.raw_user_meta_data->>'company_id')::uuid -- extracted from invite metadata
  );
  return new;
end;
$$ language plpgsql security definer;

-- Re-create trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
