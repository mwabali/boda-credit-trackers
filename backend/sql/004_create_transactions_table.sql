CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  rider_id BIGINT NOT NULL REFERENCES riders(id) ON DELETE RESTRICT,
  station_id BIGINT NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0.01),
  fuel_type VARCHAR(20) NOT NULL DEFAULT 'petrol',
  liters NUMERIC(8, 2),
  price_per_liter NUMERIC(8, 2),
  status transaction_status NOT NULL DEFAULT 'pending',
  payment_method payment_method NOT NULL DEFAULT 'credit',
  payment_date TIMESTAMP,
  receipt_number VARCHAR(50) UNIQUE,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_rider_id ON transactions(rider_id);
CREATE INDEX IF NOT EXISTS idx_transactions_station_id ON transactions(station_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
