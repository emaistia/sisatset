-- Anonymous demo accounts: each visitor gets their own throwaway user, so
-- demo sessions are fully isolated and demo data never mixes with real accounts.
-- Cleanup is triggered on the client after demo exit (deleteUser is not
-- available from anon key, so rows are removed client-side via RLS-protected
-- deletes and stale anon users are pruned periodically below).

create or replace function public.prune_stale_anon_users()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users
  where is_sso_user = false
    and email like '%@demo.sisatset.local'
    and created_at < now() - interval '2 days';
end;
$$;

comment on function public.prune_stale_anon_users is 'Removes throwaway demo accounts older than 2 days. Called by client after demo exit and opportunistically on demo start.';
