CREATE TABLE IF NOT EXISTS core.content_teams (
  content_id INT NOT NULL,
  user_id    INT NOT NULL,
  role       VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),

  CONSTRAINT pk_content_teams PRIMARY KEY (content_id, user_id, role),
  CONSTRAINT fk_ct_content
    FOREIGN KEY (content_id) REFERENCES core.contents (id) ON DELETE CASCADE,
  CONSTRAINT fk_ct_user
    FOREIGN KEY (user_id) REFERENCES core.users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_teams_content_id ON core.content_teams (content_id);
