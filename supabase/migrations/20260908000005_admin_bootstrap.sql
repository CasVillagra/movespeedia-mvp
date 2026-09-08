-- Allow the first admin to exist.
--
-- guard_profile_role_change() blocked every role change where the caller was
-- not already an admin. Direct SQL and the service_role key both run with
-- auth.uid() = null, so is_admin() is false for them too — which meant no
-- admin could ever be created, by anyone.
--
-- The guard's real purpose is stopping a signed-in user from promoting
-- themselves. A caller with no auth.uid() is either a database operator or
-- trusted server-side code holding the secret key; neither needs this guard,
-- and both need a way to bootstrap.

create or replace function private.guard_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not private.is_admin() then
    raise exception 'Only an administrator can change a user role';
  end if;
  return new;
end;
$$;

comment on function private.guard_profile_role_change() is
  'Blocks self-promotion by signed-in users. Direct SQL and service_role are '
  'exempt so the first admin can be created — see docs/operations.md.';
