
-- Seed demo users directly into auth.users (dev/demo only)
do $$
declare
  u_admin uuid := gen_random_uuid();
  u_recruiter uuid := gen_random_uuid();
  u_employee uuid := gen_random_uuid();
begin
  -- Admin
  if not exists (select 1 from auth.users where email = 'admin@demo.app') then
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', u_admin, 'authenticated', 'authenticated', 'admin@demo.app', crypt('Demo1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name','Admin Demo','role','admin'), now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), u_admin, u_admin::text, jsonb_build_object('sub', u_admin::text, 'email','admin@demo.app'), 'email', now(), now(), now());
    -- ensure role row is admin (handle_new_user defaults to employee unless meta provided; meta was provided so OK, but enforce)
    update public.user_roles set role = 'admin' where user_id = u_admin;
  end if;

  -- Recruiter
  if not exists (select 1 from auth.users where email = 'recruiter@demo.app') then
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', u_recruiter, 'authenticated', 'authenticated', 'recruiter@demo.app', crypt('Demo1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name','Recruiter Demo','role','recruiter','company_name','Demo Recruiting Co.'), now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), u_recruiter, u_recruiter::text, jsonb_build_object('sub', u_recruiter::text, 'email','recruiter@demo.app'), 'email', now(), now(), now());
  end if;

  -- Employee
  if not exists (select 1 from auth.users where email = 'employee@demo.app') then
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', u_employee, 'authenticated', 'authenticated', 'employee@demo.app', crypt('Demo1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name','Employee Demo','role','employee'), now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), u_employee, u_employee::text, jsonb_build_object('sub', u_employee::text, 'email','employee@demo.app'), 'email', now(), now(), now());
  end if;
end $$;
