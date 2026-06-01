CREATE TABLE IF NOT EXISTS auth_accounts (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  company_name VARCHAR(100) NOT NULL DEFAULT 'Total',
  station_id BIGINT UNIQUE REFERENCES stations(id) ON DELETE SET NULL,
  rider_id BIGINT UNIQUE REFERENCES riders(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_auth_accounts_role_valid
    CHECK (role IN ('company', 'station', 'rider')),
  CONSTRAINT auth_accounts_single_profile_link
    CHECK ((station_id IS NULL) OR (rider_id IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_auth_accounts_role ON auth_accounts(role);
CREATE INDEX IF NOT EXISTS idx_auth_accounts_company_name ON auth_accounts(company_name);
