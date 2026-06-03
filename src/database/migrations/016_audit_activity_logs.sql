CREATE TABLE IF NOT EXISTS audit.activity_logs (
  id         BIGSERIAL PRIMARY KEY,
  user_id    INT,
  action     VARCHAR(255) NOT NULL,
  table_name VARCHAR(255),
  record_id  INT,
  old_values TEXT,
  new_values TEXT,
  ip_address VARCHAR(100),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_activity_logs_user
    FOREIGN KEY (user_id) REFERENCES core.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON audit.activity_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON audit.activity_logs (action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON audit.activity_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_table_record
  ON audit.activity_logs (table_name, record_id);
