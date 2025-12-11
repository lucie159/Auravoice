-- Schema SQL pour PostgreSQL
-- Exécutez ce script dans votre base de données PostgreSQL

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('agent', 'admin')),
  team_id VARCHAR(50) DEFAULT 'team-1',
  avatar VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide par email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index pour filtrage par rôle
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Utilisateurs de démonstration (optionnel)
-- Mot de passe hashé avec bcrypt pour 'admin123' et 'agent123'
-- Vous devez générer vos propres hash avec bcrypt

-- INSERT INTO users (email, name, password_hash, role) VALUES
-- ('admin@auravoice.com', 'Sophie Martin', '$2b$10$...', 'admin'),
-- ('agent@auravoice.com', 'Marc Dupont', '$2b$10$...', 'agent');
