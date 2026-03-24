CREATE TABLE IF NOT EXISTS core.project_platforms (
  project_id  INT NOT NULL,
  platform_id INT NOT NULL,

  CONSTRAINT pk_project_platforms
    PRIMARY KEY (project_id, platform_id),

  CONSTRAINT fk_project_platforms_project
    FOREIGN KEY (project_id) REFERENCES core.projects (id)
    ON DELETE CASCADE,

  CONSTRAINT fk_project_platforms_platform
    FOREIGN KEY (platform_id) REFERENCES core.platforms (id)
    ON DELETE CASCADE
);