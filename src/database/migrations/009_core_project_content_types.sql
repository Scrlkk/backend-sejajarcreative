CREATE TABLE IF NOT EXISTS core.project_content_types (
  project_id      INT NOT NULL,
  content_type_id INT NOT NULL,

  CONSTRAINT pk_project_content_types
    PRIMARY KEY (project_id, content_type_id),

  CONSTRAINT fk_pct_project
    FOREIGN KEY (project_id) REFERENCES core.projects (id)
    ON DELETE CASCADE,

  CONSTRAINT fk_pct_content_type
    FOREIGN KEY (content_type_id) REFERENCES core.content_types (id)
    ON DELETE CASCADE
);