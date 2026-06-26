-- Junction table: one content can belong to many pillars
CREATE TABLE IF NOT EXISTS core.content_pillars (
  content_id INT NOT NULL,
  pillar_id  INT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),

  PRIMARY KEY (content_id, pillar_id),

  CONSTRAINT fk_cp_content
    FOREIGN KEY (content_id) REFERENCES core.contents (id) ON DELETE CASCADE,
  CONSTRAINT fk_cp_pillar
    FOREIGN KEY (pillar_id)  REFERENCES core.pillars (id)  ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_pillars_content
  ON core.content_pillars (content_id);

CREATE INDEX IF NOT EXISTS idx_content_pillars_pillar
  ON core.content_pillars (pillar_id);
