DO $$ BEGIN
  CREATE TYPE core.task_status AS ENUM (
    'pending',
    'in_progress',
    'review',
    'done'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS core.tasks (
  id          SERIAL PRIMARY KEY,
  project_id  INT NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to INT,
  start_date  DATE,
  due_date    DATE,
  status      core.task_status DEFAULT 'pending',
  created_at  TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_tasks_project
    FOREIGN KEY (project_id) REFERENCES core.projects (id)
    ON DELETE CASCADE,

  CONSTRAINT fk_tasks_assigned_to
    FOREIGN KEY (assigned_to) REFERENCES core.users (id)
    ON DELETE SET NULL,

  CONSTRAINT chk_tasks_dates
    CHECK (start_date <= due_date)
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status
  ON core.tasks (assigned_to, status);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id
  ON core.tasks (project_id);