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
  approval_status VARCHAR(20) NOT NULL DEFAULT 'approved',
  approved_at VARCHAR(64),
  approved_by_account_id BIGINT REFERENCES auth_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_auth_accounts_role_valid
    CHECK (role IN ('company', 'station', 'rider')),
  CONSTRAINT check_auth_accounts_approval_status_valid
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT auth_accounts_single_profile_link
    CHECK ((station_id IS NULL) OR (rider_id IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_auth_accounts_role ON auth_accounts(role);
CREATE INDEX IF NOT EXISTS idx_auth_accounts_company_name ON auth_accounts(company_name);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  recipient_account_id BIGINT NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  action_path VARCHAR(255),
  created_at VARCHAR(64) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at VARCHAR(64) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_notifications_type_valid
    CHECK (type IN ('info', 'success', 'warning', 'approval'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_account_id
  ON notifications(recipient_account_id);
