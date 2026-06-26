DO $$ BEGIN
  CREATE TYPE core.task_status AS ENUM (
    'to_do',
    'on_progress',
    'review',
    'revision',
    'approved',
    'overdue'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS core.tasks (
  id          SERIAL PRIMARY KEY,
  content_id  INT NOT NULL,
  assigned_to INT NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  deadline    DATE,
  status      core.task_status DEFAULT 'to_do',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  deleted_at  TIMESTAMP,
  created_at  TIMESTAMP DEFAULT now(),
  updated_at  TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_tasks_content
    FOREIGN KEY (content_id) REFERENCES core.contents (id),
  CONSTRAINT fk_tasks_assigned_to
    FOREIGN KEY (assigned_to) REFERENCES core.users (id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_content_status
  ON core.tasks (content_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status
  ON core.tasks (assigned_to, status);

CREATE INDEX IF NOT EXISTS idx_tasks_deadline_status
  ON core.tasks (deadline, status);
