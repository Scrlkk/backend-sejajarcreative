CREATE TABLE IF NOT EXISTS core.task_comments (
  id         SERIAL PRIMARY KEY,
  task_id    INT NOT NULL,
  user_id    INT,
  message    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP,

  CONSTRAINT fk_tc_task
    FOREIGN KEY (task_id) REFERENCES core.tasks (id) ON DELETE CASCADE,
  CONSTRAINT fk_tc_user
    FOREIGN KEY (user_id) REFERENCES core.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task
  ON core.task_comments (task_id, created_at);
