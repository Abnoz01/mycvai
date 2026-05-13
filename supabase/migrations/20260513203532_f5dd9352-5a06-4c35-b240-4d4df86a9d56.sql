
-- ENUMS
create type public.app_role as enum ('admin', 'recruiter', 'employee');
create type public.application_status as enum ('pending', 'interview', 'accepted', 'rejected');
create type public.contract_type as enum ('CDI', 'CDD', 'FREELANCE', 'STAGE', 'INTERIM');
create type public.offer_status as enum ('open', 'closed');

-- updated_at helper
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  locale text not null default 'fr',
  theme text not null default 'light',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create trigger profiles_updated before update on public.profiles for each row execute function public.update_updated_at_column();

-- USER ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.get_user_role(_user_id uuid)
returns app_role language sql stable security definer set search_path = public as $$
  select role from public.user_roles where user_id = _user_id order by case role when 'admin' then 1 when 'recruiter' then 2 when 'employee' then 3 end limit 1
$$;

create policy "roles_select_own" on public.user_roles for select using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "roles_admin_all" on public.user_roles for all using (public.has_role(auth.uid(),'admin'));

-- EMPLOYEE PROFILES
create table public.employee_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  age int,
  location text,
  experience_years int,
  desired_salary numeric,
  skills text[] default '{}',
  cv_path text,
  cv_text text,
  cv_score int default 0,
  profile_views int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.employee_profiles enable row level security;
create policy "emp_select_own_or_recruiter" on public.employee_profiles for select using (
  auth.uid() = user_id or public.has_role(auth.uid(),'recruiter') or public.has_role(auth.uid(),'admin')
);
create policy "emp_modify_own" on public.employee_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger emp_updated before update on public.employee_profiles for each row execute function public.update_updated_at_column();

-- COMPANIES
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  logo_url text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.companies enable row level security;
create policy "companies_select_all" on public.companies for select using (true);
create policy "companies_modify_own" on public.companies for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create trigger companies_updated before update on public.companies for each row execute function public.update_updated_at_column();

-- JOB OFFERS
create table public.job_offers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  recruiter_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  skills text[] default '{}',
  contract_type contract_type not null default 'CDI',
  location text,
  salary numeric,
  expires_at date,
  easy_apply boolean not null default false,
  views int not null default 0,
  status offer_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.job_offers enable row level security;
create policy "offers_select_all" on public.job_offers for select using (true);
create policy "offers_modify_own" on public.job_offers for all using (auth.uid() = recruiter_id) with check (auth.uid() = recruiter_id);
create trigger offers_updated before update on public.job_offers for each row execute function public.update_updated_at_column();
create index idx_offers_recruiter on public.job_offers(recruiter_id);

-- APPLICATIONS
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_offers(id) on delete cascade,
  employee_id uuid not null references auth.users(id) on delete cascade,
  match_percent int default 0,
  status application_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, employee_id)
);
alter table public.applications enable row level security;
create policy "apps_select_employee" on public.applications for select using (auth.uid() = employee_id);
create policy "apps_select_recruiter" on public.applications for select using (
  exists (select 1 from public.job_offers o where o.id = job_id and o.recruiter_id = auth.uid())
);
create policy "apps_insert_employee" on public.applications for insert with check (auth.uid() = employee_id);
create policy "apps_update_recruiter" on public.applications for update using (
  exists (select 1 from public.job_offers o where o.id = job_id and o.recruiter_id = auth.uid())
);
create trigger apps_updated before update on public.applications for each row execute function public.update_updated_at_column();
create index idx_apps_job on public.applications(job_id);
create index idx_apps_emp on public.applications(employee_id);

-- INVITATIONS
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references auth.users(id) on delete cascade,
  employee_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.job_offers(id) on delete cascade,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
alter table public.invitations enable row level security;
create policy "inv_select_parties" on public.invitations for select using (auth.uid() in (recruiter_id, employee_id));
create policy "inv_insert_recruiter" on public.invitations for insert with check (auth.uid() = recruiter_id);
create policy "inv_update_employee" on public.invitations for update using (auth.uid() = employee_id);

-- REVIEWS
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  job_title text,
  rating int not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
create policy "reviews_select_all" on public.reviews for select using (true);
create policy "reviews_insert_auth" on public.reviews for insert with check (auth.uid() is not null);

-- CONTACT MESSAGES
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
create policy "contact_insert_anyone" on public.contact_messages for insert with check (true);
create policy "contact_select_admin" on public.contact_messages for select using (public.has_role(auth.uid(),'admin'));

-- AUTO-CREATE PROFILE + ROLE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _role app_role;
  _name text;
begin
  _role := coalesce((new.raw_user_meta_data->>'role')::app_role, 'employee');
  _name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  insert into public.profiles (id, full_name) values (new.id, _name);
  insert into public.user_roles (user_id, role) values (new.id, _role);

  if _role = 'employee' then
    insert into public.employee_profiles (user_id) values (new.id);
  elsif _role = 'recruiter' then
    insert into public.companies (owner_id, name)
    values (new.id, coalesce(new.raw_user_meta_data->>'company_name', _name || ' Co.'));
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public) values
  ('cvs','cvs',false),
  ('avatars','avatars',true),
  ('logos','logos',true)
on conflict (id) do nothing;

-- avatars: public read, owner write
create policy "avatars_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_write_own" on storage.objects for insert with check (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "avatars_update_own" on storage.objects for update using (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);

-- logos: public read, recruiter write own
create policy "logos_read" on storage.objects for select using (bucket_id = 'logos');
create policy "logos_write_own" on storage.objects for insert with check (
  bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]
);

-- cvs: owner full access; recruiters read when application exists
create policy "cvs_owner_all" on storage.objects for all using (
  bucket_id = 'cvs' and auth.uid()::text = (storage.foldername(name))[1]
) with check (
  bucket_id = 'cvs' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "cvs_recruiter_read" on storage.objects for select using (
  bucket_id = 'cvs' and exists (
    select 1 from public.applications a
    join public.job_offers o on o.id = a.job_id
    where o.recruiter_id = auth.uid()
      and a.employee_id::text = (storage.foldername(name))[1]
  )
);

-- Seed reviews + companies for landing page
insert into public.reviews (author_name, job_title, rating, comment) values
  ('Sarah K.', 'Frontend Developer', 5, 'Found my dream job in 2 weeks. The AI matching is incredibly accurate.'),
  ('Ahmed B.', 'Product Manager', 5, 'The CV correction tool saved me hours. Got 3 interviews from one application.'),
  ('Maria L.', 'Data Scientist', 4, 'Clean interface, smart matching. Best recruitment platform I have used.');
