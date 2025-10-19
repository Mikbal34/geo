-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Add user_id to brands table
ALTER TABLE brands ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index on user_id for faster queries
CREATE INDEX idx_brands_user_id ON brands(user_id);

-- Update existing brands to have a default user (optional - for migration)
-- You can skip this if you want to start fresh
-- INSERT INTO users (id, email, password_hash)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'demo@example.com', 'demo_hash')
-- ON CONFLICT (id) DO NOTHING;
-- UPDATE brands SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;

COMMENT ON TABLE users IS 'Stores user authentication data';
COMMENT ON COLUMN users.email IS 'User email address (unique)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN brands.user_id IS 'References the user who owns this brand/project';
