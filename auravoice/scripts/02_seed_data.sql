-- Seed initial data for development/testing

-- Insert default team
INSERT INTO teams (id, name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Équipe Service Client')
ON CONFLICT DO NOTHING;

-- Insert test users
-- Password is 'password123' hashed with bcrypt
INSERT INTO users (id, email, password_hash, name, role, team_id) VALUES 
  (
    '00000000-0000-0000-0000-000000000101',
    'sophie.martin@auravoice.com',
    '$2a$10$rOzWqJ4K5K5K5K5K5K5K5u.XxXxXxXxXxXxXxXxXxXxXxXxXx', -- Replace with real hash
    'Sophie Martin',
    'supervisor',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'marc.dupont@auravoice.com',
    '$2a$10$rOzWqJ4K5K5K5K5K5K5K5u.XxXxXxXxXxXxXxXxXxXxXxXxXx', -- Replace with real hash
    'Marc Dupont',
    'agent',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'lea.bernard@auravoice.com',
    '$2a$10$rOzWqJ4K5K5K5K5K5K5K5u.XxXxXxXxXxXxXxXxXxXxXxXxXx',
    'Léa Bernard',
    'agent',
    '00000000-0000-0000-0000-000000000001'
  )
ON CONFLICT (email) DO NOTHING;
