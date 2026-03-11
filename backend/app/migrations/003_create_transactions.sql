CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    rider_id INTEGER REFERENCES riders(id),
    station_id INTEGER REFERENCES stations(id),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);