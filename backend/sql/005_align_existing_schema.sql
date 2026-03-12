ALTER TABLE riders
  ADD COLUMN IF NOT EXISTS national_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 100000.00,
  ADD COLUMN IF NOT EXISTS current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS status rider_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE riders
  ALTER COLUMN phone SET NOT NULL,
  ALTER COLUMN license_plate SET NOT NULL;

ALTER TABLE stations
  ADD COLUMN IF NOT EXISTS manager_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS status station_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE stations
  ALTER COLUMN location SET NOT NULL;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(20) NOT NULL DEFAULT 'petrol',
  ADD COLUMN IF NOT EXISTS liters NUMERIC(8, 2),
  ADD COLUMN IF NOT EXISTS price_per_liter NUMERIC(8, 2),
  ADD COLUMN IF NOT EXISTS payment_method payment_method NOT NULL DEFAULT 'credit',
  ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS notes TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'transactions_receipt_number_key'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_receipt_number_key UNIQUE (receipt_number);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_riders_status ON riders(status);
CREATE INDEX IF NOT EXISTS idx_riders_created_at ON riders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stations_status ON stations(status);
CREATE INDEX IF NOT EXISTS idx_stations_created_at ON stations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_rider_id ON transactions(rider_id);
CREATE INDEX IF NOT EXISTS idx_transactions_station_id ON transactions(station_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
