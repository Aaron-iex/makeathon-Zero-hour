CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY REFERENCES registrations(id) ON DELETE CASCADE,
  payment_ref TEXT NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT
);

CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(email);
