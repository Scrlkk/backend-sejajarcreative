CREATE TABLE IF NOT EXISTS analytics.engagements (
  id          SERIAL PRIMARY KEY,
  content_id  INT NOT NULL,
  likes       INT DEFAULT 0,
  views       INT DEFAULT 0,
  comments    INT DEFAULT 0,
  shares      INT DEFAULT 0,
  recorded_at TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_engagements_content
    FOREIGN KEY (content_id) REFERENCES core.contents (id) ON DELETE CASCADE,
  CONSTRAINT chk_engagements_likes CHECK (likes >= 0),
  CONSTRAINT chk_engagements_views CHECK (views >= 0),
  CONSTRAINT chk_engagements_comments CHECK (comments >= 0),
  CONSTRAINT chk_engagements_shares CHECK (shares >= 0)
);

CREATE INDEX IF NOT EXISTS idx_engagements_content_recorded
  ON analytics.engagements (content_id, recorded_at);
