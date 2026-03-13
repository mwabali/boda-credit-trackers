BEGIN;

TRUNCATE TABLE transactions, stations, riders RESTART IDENTITY CASCADE;

INSERT INTO riders (
  id,
  name,
  phone,
  license_plate,
  national_id,
  credit_limit,
  current_balance,
  status,
  created_at,
  updated_at
)
VALUES
  (1, 'John Mukasa', '+256701234567', 'UAB 123X', NULL, 100000.00, 0.00, 'active', '2026-03-13 07:05:09.725+00', '2026-03-13 07:05:09.725+00'),
  (2, 'Sarah Nambi', '+256702345678', 'UCD 456Y', NULL, 100000.00, 0.00, 'active', '2026-03-13 07:05:09.725+00', '2026-03-13 07:05:09.725+00'),
  (3, 'David Okello', '+256703456789', 'UEF 789Z', NULL, 100000.00, 0.00, 'active', '2026-03-13 07:05:09.725+00', '2026-03-13 07:05:09.725+00'),
  (4, 'Grace Auma', '+256704567890', 'UGH 012A', NULL, 100000.00, 0.00, 'active', '2026-03-13 07:05:09.725+00', '2026-03-13 07:05:09.725+00'),
  (5, 'Peter Ojok', '+256705678901', 'UIJ 345B', NULL, 100000.00, 0.00, 'inactive', '2026-03-13 07:05:09.725+00', '2026-03-13 07:05:09.725+00');

INSERT INTO stations (
  id,
  name,
  company_name,
  location,
  manager_name,
  manager_phone,
  status,
  created_at,
  updated_at
)
VALUES
  (1, 'Kampala Road', 'Total', 'Kampala Road, Central', 'Robert Kayongo', '+256770111001', 'active', '2026-03-13 07:05:09.837+00', '2026-03-13 07:05:09.837+00'),
  (2, 'Jinja Road', 'Total', 'Jinja Road, Nakawa', 'Mary Nantongo', '+256770111002', 'active', '2026-03-13 07:05:09.837+00', '2026-03-13 07:05:09.837+00'),
  (3, 'Bombo Road', 'Total', 'Bombo Road, Kawempe', 'James Ssekito', '+256770111003', 'active', '2026-03-13 07:05:09.837+00', '2026-03-13 07:05:09.837+00'),
  (4, 'Entebbe Road', 'Total', 'Entebbe Road, Makindye', 'Susan Kigozi', '+256770111004', 'active', '2026-03-13 07:05:09.837+00', '2026-03-13 07:05:09.837+00');

INSERT INTO transactions (
  id,
  rider_id,
  station_id,
  amount,
  fuel_type,
  liters,
  price_per_liter,
  status,
  payment_method,
  payment_date,
  receipt_number,
  notes,
  created_at,
  updated_at
)
VALUES
  (1, 1, 1, 50000.00, 'petrol', 20.00, NULL, 'paid', 'credit', NULL, NULL, 'Full tank payment', '2026-03-13 07:05:09.929+00', '2026-03-13 07:05:09.929+00'),
  (2, 2, 1, 30000.00, 'petrol', 12.00, NULL, 'pending', 'credit', NULL, NULL, 'Partial fill', '2026-03-13 07:05:09.929+00', '2026-03-13 07:05:09.929+00'),
  (3, 1, 2, 45000.00, 'petrol', 18.00, NULL, 'pending', 'credit', NULL, NULL, 'Emergency fuel', '2026-03-13 07:05:09.929+00', '2026-03-13 07:05:09.929+00'),
  (4, 3, 3, 60000.00, 'petrol', 24.00, NULL, 'paid', 'credit', NULL, NULL, 'Weekly credit cleared', '2026-03-13 07:05:09.929+00', '2026-03-13 07:05:09.929+00'),
  (5, 4, 2, 25000.00, 'petrol', 10.00, NULL, 'cancelled', 'credit', NULL, NULL, 'Incorrect amount', '2026-03-13 07:05:09.929+00', '2026-03-13 07:05:09.929+00'),
  (6, 2, 4, 55000.00, 'petrol', 22.00, NULL, 'pending', 'credit', NULL, NULL, 'Long distance trip', '2026-03-13 07:05:09.929+00', '2026-03-13 07:05:09.929+00');

UPDATE riders AS r
SET current_balance = COALESCE(outstanding.balance, 0.00)
FROM (
  SELECT rider_id, SUM(amount)::NUMERIC(12, 2) AS balance
  FROM transactions
  WHERE status IN ('pending', 'approved')
  GROUP BY rider_id
) AS outstanding
WHERE r.id = outstanding.rider_id;

UPDATE riders
SET current_balance = 0.00
WHERE id NOT IN (
  SELECT DISTINCT rider_id
  FROM transactions
  WHERE status IN ('pending', 'approved')
);

SELECT setval(pg_get_serial_sequence('riders', 'id'), COALESCE(MAX(id), 1), true) FROM riders;
SELECT setval(pg_get_serial_sequence('stations', 'id'), COALESCE(MAX(id), 1), true) FROM stations;
SELECT setval(pg_get_serial_sequence('transactions', 'id'), COALESCE(MAX(id), 1), true) FROM transactions;

COMMIT;
