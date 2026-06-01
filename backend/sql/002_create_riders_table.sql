CREATE TABLE IF NOT EXISTS riders (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  license_plate VARCHAR(20) NOT NULL,
  national_id VARCHAR(50),
  credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 100000.00,
  current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_riders_status ON riders(status);
CREATE INDEX IF NOT EXISTS idx_riders_created_at ON riders(created_at DESC);
