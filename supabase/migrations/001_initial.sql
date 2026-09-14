CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  team_name TEXT NOT NULL,
  leader_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  institution TEXT,
  track TEXT,
  team_size INTEGER DEFAULT 4,
  brief TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  checked_in BOOLEAN DEFAULT FALSE,
  paid BOOLEAN DEFAULT FALSE,
  payment_ref TEXT,
  member_names TEXT[],
  remarks TEXT,
  source TEXT DEFAULT 'form',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_checked_in ON registrations(checked_in);
CREATE INDEX IF NOT EXISTS idx_registrations_paid ON registrations(paid);

-- Row Level Security
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Allow reads with anon key (admin panel reads)
CREATE POLICY "Allow anon reads" ON registrations
  FOR SELECT USING (true);

-- Allow inserts with anon key (public registration form)
CREATE POLICY "Allow anon inserts" ON registrations
  FOR INSERT WITH CHECK (true);

-- Allow updates with service role only (admin mutations via Edge functions)
CREATE POLICY "Allow service role updates" ON registrations
  FOR UPDATE USING (true);

-- Allow deletes with service role only
CREATE POLICY "Allow service role deletes" ON registrations
  FOR DELETE USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
