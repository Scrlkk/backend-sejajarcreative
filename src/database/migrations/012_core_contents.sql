DO $$ BEGIN
  CREATE TYPE core.content_status AS ENUM (
    'draft',
    'in_review',
    'approved',
    'published'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS core.contents (
  id                SERIAL PRIMARY KEY,
  project_id        INT NOT NULL,
  task_id           INT,
  content_pillar_id INT,
  title             VARCHAR(255) NOT NULL,
  file_url          VARCHAR(500),
  caption           TEXT,
  publish_date      TIMESTAMP,
  published_at      TIMESTAMP,
  status            core.content_status DEFAULT 'draft',
  created_at        TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_contents_project
    FOREIGN KEY (project_id) REFERENCES core.projects (id)
    ON DELETE CASCADE,

  CONSTRAINT fk_contents_task
    FOREIGN KEY (task_id) REFERENCES core.tasks (id)
    ON DELETE SET NULL,

  CONSTRAINT fk_contents_pillar
    FOREIGN KEY (content_pillar_id) REFERENCES core.content_pillars (id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_contents_project_status
  ON core.contents (project_id, status);

CREATE INDEX IF NOT EXISTS idx_contents_pillar
  ON core.contents (content_pillar_id);