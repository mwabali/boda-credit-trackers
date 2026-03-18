ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_accounts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.riders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.stations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.auth_accounts FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.riders FROM anon, authenticated;
REVOKE ALL ON TABLE public.stations FROM anon, authenticated;
REVOKE ALL ON TABLE public.transactions FROM anon, authenticated;
REVOKE ALL ON TABLE public.auth_accounts FROM anon, authenticated;

DROP POLICY IF EXISTS riders_deny_direct_api ON public.riders;
DROP POLICY IF EXISTS stations_deny_direct_api ON public.stations;
DROP POLICY IF EXISTS transactions_deny_direct_api ON public.transactions;
DROP POLICY IF EXISTS auth_accounts_deny_direct_api ON public.auth_accounts;

CREATE POLICY riders_deny_direct_api
ON public.riders
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY stations_deny_direct_api
ON public.stations
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY transactions_deny_direct_api
ON public.transactions
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY auth_accounts_deny_direct_api
ON public.auth_accounts
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);
