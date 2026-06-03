DO $$ BEGIN
  CREATE TYPE core.assignment_role_type AS ENUM (
    'scriptwriter',
    'content_editor',
    'social_media_admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS core.task_assignments (
  id               SERIAL PRIMARY KEY,
  task_id          INT NOT NULL,
  assigned_to      INT NOT NULL,
  assignment_role  core.assignment_role_type NOT NULL,
  script_text      TEXT,
  file_url         VARCHAR(500),
  notes_from_admin TEXT,
  status           core.task_status DEFAULT 'pending',
  submitted_at     TIMESTAMP,
  deleted_at       TIMESTAMP,

  CONSTRAINT fk_ta_task
    FOREIGN KEY (task_id) REFERENCES core.tasks (id) ON DELETE CASCADE,
  CONSTRAINT fk_ta_assigned_to
    FOREIGN KEY (assigned_to) REFERENCES core.users (id)
);

CREATE INDEX IF NOT EXISTS idx_ta_assigned_status
  ON core.task_assignments (assigned_to, status);

CREATE INDEX IF NOT EXISTS idx_ta_task
  ON core.task_assignments (task_id);
