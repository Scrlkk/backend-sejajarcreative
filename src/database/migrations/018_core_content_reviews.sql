CREATE TABLE IF NOT EXISTS core.content_reviews (
  id          SERIAL PRIMARY KEY,
  content_id  INT NOT NULL,
  reviewer_id INT NOT NULL,
  feedback    TEXT NOT NULL,
  reviewed_at TIMESTAMP DEFAULT now(),
  created_at  TIMESTAMP DEFAULT now(),
  updated_at  TIMESTAMP DEFAULT now(),
  deleted_at  TIMESTAMP,

  CONSTRAINT fk_cr_content
    FOREIGN KEY (content_id) REFERENCES core.contents (id),
  CONSTRAINT fk_cr_reviewer
    FOREIGN KEY (reviewer_id) REFERENCES core.users (id)
);

CREATE INDEX IF NOT EXISTS idx_content_reviews_content
  ON core.content_reviews (content_id, created_at);
