CREATE TABLE IF NOT EXISTS auth.password_resets (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL,
  token      VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now(),

  CONSTRAINT uq_password_resets_token
    UNIQUE (token),

  CONSTRAINT fk_password_resets_user
    FOREIGN KEY (user_id) REFERENCES core.users (id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_password_resets_token
  ON auth.password_resets (token);