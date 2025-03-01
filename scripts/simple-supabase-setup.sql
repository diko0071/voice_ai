-- Create text_logs table
CREATE TABLE IF NOT EXISTS text_logs (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  is_transcription BOOLEAN,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for quick searching
CREATE INDEX IF NOT EXISTS idx_text_logs_session_id ON text_logs(session_id);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active BIGINT NOT NULL,
  metadata JSONB
);

-- Create index for quick searching
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);

-- Enable Row Level Security (RLS)
ALTER TABLE text_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access
CREATE POLICY "Allow anonymous select on text_logs" ON text_logs FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on text_logs" ON text_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on text_logs" ON text_logs FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous select on sessions" ON sessions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on sessions" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on sessions" ON sessions FOR UPDATE USING (true); 