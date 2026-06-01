CREATE TABLE IF NOT EXISTS stations (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  company_name VARCHAR(100) NOT NULL DEFAULT 'Total',
  location VARCHAR(200) NOT NULL,
  manager_name VARCHAR(100),
  manager_phone VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'closed', 'maintenance')),
  created_at VARCHAR(64) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at VARCHAR(64) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stations_status ON stations(status);
CREATE INDEX IF NOT EXISTS idx_stations_created_at ON stations(created_at DESC);
