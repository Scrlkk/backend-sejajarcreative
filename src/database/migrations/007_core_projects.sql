DO $$ BEGIN
  CREATE TYPE core.project_status AS ENUM (
    'planning',
    'ongoing',
    'review',
    'completed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS core.projects (
  id           SERIAL PRIMARY KEY,
  client_id    INT NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  description  TEXT,
  start_date   DATE,
  end_date     DATE,
  status       core.project_status DEFAULT 'planning',
  created_by   INT NOT NULL,
  created_at   TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_projects_client
    FOREIGN KEY (client_id) REFERENCES core.clients (id),

  CONSTRAINT fk_projects_created_by
    FOREIGN KEY (created_by) REFERENCES core.users (id),

  CONSTRAINT chk_projects_dates
    CHECK (start_date <= end_date)
);

CREATE INDEX IF NOT EXISTS idx_projects_client_status
  ON core.projects (client_id, status);

CREATE INDEX IF NOT EXISTS idx_projects_created_by
  ON core.projects (created_by);