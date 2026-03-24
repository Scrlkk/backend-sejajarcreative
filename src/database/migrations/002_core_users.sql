DO $$ BEGIN
  CREATE TYPE core.user_role AS ENUM (
    'superadmin',
    'owner',
    'content_lead',
    'content_editor',
    'script_writer',
    'admin_social_media'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS core.users (
  id         SERIAL PRIMARY KEY,
  full_name  VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       core.user_role NOT NULL,
  created_at TIMESTAMP DEFAULT now(),

  CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON core.users (email);