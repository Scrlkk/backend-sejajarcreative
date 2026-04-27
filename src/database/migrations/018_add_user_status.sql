DO $$ BEGIN
  CREATE TYPE core.user_status AS ENUM (
    'active',
    'inactive',
    'suspended'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE core.users
ADD COLUMN is_active BOOLEAN DEFAULT true;

ALTER TABLE core.users 
ADD COLUMN deleted_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_users_is_active 
ON core.users (is_active);