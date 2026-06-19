CREATE TABLE IF NOT EXISTS core.task_outputs (
  id           SERIAL PRIMARY KEY,
  task_id      INT NOT NULL,
  caption      TEXT,
  hashtag      TEXT,
  file_url     VARCHAR(500),
  version      INT DEFAULT 1,
  submitted_at TIMESTAMP DEFAULT now(),
  deleted_at   TIMESTAMP,

  CONSTRAINT fk_to_task
    FOREIGN KEY (task_id) REFERENCES core.tasks (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_outputs_task
  ON core.task_outputs (task_id, submitted_at);
