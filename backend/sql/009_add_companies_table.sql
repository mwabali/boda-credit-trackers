CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  created_at VARCHAR(64) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at VARCHAR(64) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE stations
  ADD COLUMN IF NOT EXISTS company_id INTEGER;

ALTER TABLE auth_accounts
  ADD COLUMN IF NOT EXISTS company_id INTEGER;

INSERT INTO companies (name, created_at, updated_at)
SELECT DISTINCT company_name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM stations
WHERE company_name IS NOT NULL AND TRIM(company_name) <> ''
ON CONFLICT (name) DO NOTHING;

INSERT INTO companies (name, created_at, updated_at)
SELECT DISTINCT company_name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM auth_accounts
WHERE company_name IS NOT NULL
  AND TRIM(company_name) <> ''
  AND role IN ('company', 'station')
ON CONFLICT (name) DO NOTHING;

UPDATE stations
SET company_id = companies.id
FROM companies
WHERE stations.company_id IS NULL
  AND companies.name = stations.company_name;

UPDATE auth_accounts
SET company_id = companies.id
FROM companies
WHERE auth_accounts.company_id IS NULL
  AND auth_accounts.role IN ('company', 'station')
  AND companies.name = auth_accounts.company_name;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'stations_company_id_fkey'
  ) THEN
    ALTER TABLE stations
      ADD CONSTRAINT stations_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'auth_accounts_company_id_fkey'
  ) THEN
    ALTER TABLE auth_accounts
      ADD CONSTRAINT auth_accounts_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stations_company_id ON stations(company_id);
CREATE INDEX IF NOT EXISTS idx_auth_accounts_company_id ON auth_accounts(company_id);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies NO FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.companies FROM anon, authenticated;
DROP POLICY IF EXISTS companies_deny_direct_api ON public.companies;
CREATE POLICY companies_deny_direct_api
  ON public.companies
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
