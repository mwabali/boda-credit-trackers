DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'companies'
  ) THEN
    EXECUTE 'ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.companies FORCE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON TABLE public.companies FROM anon, authenticated';
    EXECUTE 'DROP POLICY IF EXISTS companies_deny_direct_api ON public.companies';
    EXECUTE $policy$
      CREATE POLICY companies_deny_direct_api
      ON public.companies
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false)
    $policy$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'riders'
  ) THEN
    EXECUTE 'ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.riders FORCE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON TABLE public.riders FROM anon, authenticated';
    EXECUTE 'DROP POLICY IF EXISTS riders_deny_direct_api ON public.riders';
    EXECUTE $policy$
      CREATE POLICY riders_deny_direct_api
      ON public.riders
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false)
    $policy$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'stations'
  ) THEN
    EXECUTE 'ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.stations FORCE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON TABLE public.stations FROM anon, authenticated';
    EXECUTE 'DROP POLICY IF EXISTS stations_deny_direct_api ON public.stations';
    EXECUTE $policy$
      CREATE POLICY stations_deny_direct_api
      ON public.stations
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false)
    $policy$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'transactions'
  ) THEN
    EXECUTE 'ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.transactions FORCE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON TABLE public.transactions FROM anon, authenticated';
    EXECUTE 'DROP POLICY IF EXISTS transactions_deny_direct_api ON public.transactions';
    EXECUTE $policy$
      CREATE POLICY transactions_deny_direct_api
      ON public.transactions
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false)
    $policy$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) THEN
    EXECUTE 'ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON TABLE public.notifications FROM anon, authenticated';
    EXECUTE 'DROP POLICY IF EXISTS notifications_deny_direct_api ON public.notifications';
    EXECUTE $policy$
      CREATE POLICY notifications_deny_direct_api
      ON public.notifications
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false)
    $policy$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'auth_accounts'
  ) THEN
    EXECUTE 'ALTER TABLE public.auth_accounts ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.auth_accounts FORCE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON TABLE public.auth_accounts FROM anon, authenticated';
    EXECUTE 'DROP POLICY IF EXISTS auth_accounts_deny_direct_api ON public.auth_accounts';
    EXECUTE $policy$
      CREATE POLICY auth_accounts_deny_direct_api
      ON public.auth_accounts
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false)
    $policy$;
  END IF;
END $$;
