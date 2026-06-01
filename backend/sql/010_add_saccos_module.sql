CREATE TABLE IF NOT EXISTS saccos (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  registration_number VARCHAR(80) UNIQUE,
  contact_phone VARCHAR(20),
  location VARCHAR(200),
  created_at VARCHAR(64) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at VARCHAR(64) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE riders
  ADD COLUMN IF NOT EXISTS sacco_id INTEGER;

ALTER TABLE auth_accounts
  ADD COLUMN IF NOT EXISTS sacco_id INTEGER;

ALTER TABLE riders
  DROP CONSTRAINT IF EXISTS riders_sacco_id_fkey;

ALTER TABLE riders
  ADD CONSTRAINT riders_sacco_id_fkey
  FOREIGN KEY (sacco_id) REFERENCES saccos(id);

ALTER TABLE auth_accounts
  DROP CONSTRAINT IF EXISTS auth_accounts_sacco_id_fkey;

ALTER TABLE auth_accounts
  ADD CONSTRAINT auth_accounts_sacco_id_fkey
  FOREIGN KEY (sacco_id) REFERENCES saccos(id);

ALTER TABLE auth_accounts
  DROP CONSTRAINT IF EXISTS check_auth_accounts_role_valid;

ALTER TABLE auth_accounts
  ADD CONSTRAINT check_auth_accounts_role_valid
  CHECK (role IN ('company', 'sacco', 'station', 'rider'));

CREATE INDEX IF NOT EXISTS idx_riders_sacco_id ON riders(sacco_id);
CREATE INDEX IF NOT EXISTS idx_auth_accounts_sacco_id ON auth_accounts(sacco_id);

ALTER TABLE public.saccos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saccos FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.saccos FROM anon, authenticated;
DROP POLICY IF EXISTS saccos_deny_direct_api ON public.saccos;
CREATE POLICY saccos_deny_direct_api
  ON public.saccos
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE TABLE IF NOT EXISTS sms_outbox (
  id SERIAL PRIMARY KEY,
  rider_id INTEGER REFERENCES riders(id),
  transaction_id INTEGER REFERENCES transactions(id),
  recipient_phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  provider_response TEXT,
  created_at VARCHAR(64) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at VARCHAR(64) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_sms_outbox_status_valid
    CHECK (status IN ('queued', 'sent', 'failed'))
);

ALTER TABLE public.sms_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_outbox FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.sms_outbox FROM anon, authenticated;
DROP POLICY IF EXISTS sms_outbox_deny_direct_api ON public.sms_outbox;
CREATE POLICY sms_outbox_deny_direct_api
  ON public.sms_outbox
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
