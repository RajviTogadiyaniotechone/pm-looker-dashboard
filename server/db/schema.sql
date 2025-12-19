-- Enable UUID extension if needed, or just use serial
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(100) -- Lucide icon name or similar
);

CREATE TABLE IF NOT EXISTS charts (
    id SERIAL PRIMARY KEY,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    embed_url TEXT NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User-Module Access Control (Admin can assign specific modules to users)
CREATE TABLE IF NOT EXISTS user_module_access (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, module_id)
);

-- Seed initial modules
INSERT INTO modules (name, slug, icon) VALUES 
('Project Management', 'pm', 'Briefcase'),
('Sales', 'sales', 'TrendingUp'),
('Human Resources', 'hr', 'Users')
ON CONFLICT (slug) DO NOTHING;

-- Note: Admin users have access to all modules by default (handled in application logic)
-- Regular users only see modules granted via user_module_access table

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS module_messages (
    id SERIAL PRIMARY KEY,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_module_messages_module_id ON module_messages(module_id);
CREATE INDEX IF NOT EXISTS idx_module_messages_created_at ON module_messages(created_at DESC);
