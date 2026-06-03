DO $$ BEGIN
  CREATE TYPE core.review_status AS ENUM (
    'revision',
    'approved'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS core.reviews (
  id                 SERIAL PRIMARY KEY,
  task_assignment_id INT NOT NULL,
  reviewer_id        INT NOT NULL,
  feedback           TEXT,
  status             core.review_status,
  reviewed_at        TIMESTAMP,
  created_at         TIMESTAMP DEFAULT now(),
  updated_at         TIMESTAMP DEFAULT now(),
  deleted_at         TIMESTAMP,

  CONSTRAINT fk_reviews_task_assignment
    FOREIGN KEY (task_assignment_id) REFERENCES core.task_assignments (id),
  CONSTRAINT fk_reviews_reviewer
    FOREIGN KEY (reviewer_id) REFERENCES core.users (id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_ta_reviewer
  ON core.reviews (task_assignment_id, reviewer_id);

CREATE INDEX IF NOT EXISTS idx_reviews_status
  ON core.reviews (status);
