CREATE TABLE IF NOT EXISTS notification.notifications (
  id           BIGSERIAL PRIMARY KEY,
  recipient_id INT NOT NULL,
  sender_id    INT,
  title        VARCHAR(255) NOT NULL,
  message      TEXT NOT NULL,
  source_type  VARCHAR(100) NOT NULL,
  source_id    INT NOT NULL,
  is_read      BOOLEAN NOT NULL DEFAULT false,
  read_at      TIMESTAMP,
  created_at   TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_notifications_recipient
    FOREIGN KEY (recipient_id) REFERENCES core.users (id),
  CONSTRAINT fk_notifications_sender
    FOREIGN KEY (sender_id) REFERENCES core.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read
  ON notification.notifications (recipient_id, is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_created
  ON notification.notifications (created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_source
  ON notification.notifications (source_type, source_id);
