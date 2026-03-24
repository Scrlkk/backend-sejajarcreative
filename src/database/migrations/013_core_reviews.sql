DO $$ BEGIN
  CREATE TYPE core.review_status AS ENUM (
    'revision',
    'approved'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS core.reviews (
  id          SERIAL PRIMARY KEY,
  content_id  INT NOT NULL,
  reviewer_id INT NOT NULL,
  feedback    TEXT,
  status      core.review_status,
  reviewed_at TIMESTAMP,

  CONSTRAINT fk_reviews_content
    FOREIGN KEY (content_id) REFERENCES core.contents (id)
    ON DELETE CASCADE,

  CONSTRAINT fk_reviews_reviewer
    FOREIGN KEY (reviewer_id) REFERENCES core.users (id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_reviews_content_id
  ON core.reviews (content_id);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id
  ON core.reviews (reviewer_id);