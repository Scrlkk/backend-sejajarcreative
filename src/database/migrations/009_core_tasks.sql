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
  content_id  INT NOT NULL,
  pillar_id   INT NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  start_date  DATE,
  due_date    DATE,
  status      core.task_status DEFAULT 'pending',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  deleted_at  TIMESTAMP,
  created_at  TIMESTAMP DEFAULT now(),
  updated_at  TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_tasks_content
    FOREIGN KEY (content_id) REFERENCES core.contents (id),
  CONSTRAINT fk_tasks_pillar
    FOREIGN KEY (pillar_id) REFERENCES core.pillars (id),
  CONSTRAINT chk_tasks_dates
    CHECK (start_date IS NULL OR due_date IS NULL OR start_date <= due_date)
);

CREATE INDEX IF NOT EXISTS idx_tasks_content_status
  ON core.tasks (content_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date_status
  ON core.tasks (due_date, status);

CREATE INDEX IF NOT EXISTS idx_tasks_pillar
  ON core.tasks (pillar_id);
