-- AuraVoice Database Schema
-- Execute this script to create all necessary tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('agent', 'supervisor')),
  team_id UUID NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Active calls table (real-time tracking)
CREATE TABLE IF NOT EXISTS active_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  call_sid VARCHAR(255), -- Twilio or other telephony system ID
  start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  current_emotion VARCHAR(20),
  current_confidence DECIMAL(5,2),
  alert_triggered BOOLEAN DEFAULT FALSE,
  alert_duration INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Call reports table (post-call analysis)
CREATE TABLE IF NOT EXISTS call_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  call_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  duration INTEGER NOT NULL, -- seconds
  audio_url TEXT,
  audio_file_name VARCHAR(255),
  dominant_emotion VARCHAR(20),
  anger_percentage DECIMAL(5,2),
  joy_percentage DECIMAL(5,2),
  calm_percentage DECIMAL(5,2),
  anxiety_percentage DECIMAL(5,2),
  surprise_percentage DECIMAL(5,2),
  sadness_percentage DECIMAL(5,2),
  average_confidence DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Emotion timeline table (detailed emotion data)
CREATE TABLE IF NOT EXISTS emotion_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_report_id UUID REFERENCES call_reports(id) ON DELETE CASCADE,
  active_call_id UUID REFERENCES active_calls(id) ON DELETE CASCADE,
  speaker VARCHAR(20) NOT NULL CHECK (speaker IN ('client', 'agent')),
  emotion VARCHAR(20) NOT NULL,
  confidence DECIMAL(5,2) NOT NULL,
  timestamp_ms INTEGER NOT NULL, -- milliseconds from call start
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audio files table (blob storage references)
CREATE TABLE IF NOT EXISTS audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_report_id UUID REFERENCES call_reports(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  storage_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_active_calls_agent ON active_calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_call_reports_agent ON call_reports(agent_id);
CREATE INDEX IF NOT EXISTS idx_call_reports_date ON call_reports(call_date);
CREATE INDEX IF NOT EXISTS idx_emotion_timeline_call_report ON emotion_timeline(call_report_id);
CREATE INDEX IF NOT EXISTS idx_emotion_timeline_active_call ON emotion_timeline(active_call_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
