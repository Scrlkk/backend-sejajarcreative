CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL,
  token      VARCHAR(512) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now(),

  CONSTRAINT uq_refresh_tokens_token UNIQUE (token),
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES core.users (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_refresh_tokens_token
  ON auth.refresh_tokens (token);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_expires
  ON auth.refresh_tokens (user_id, expires_at);
