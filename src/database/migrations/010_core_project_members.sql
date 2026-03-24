CREATE TABLE IF NOT EXISTS core.project_members (
  project_id      INT NOT NULL,
  user_id         INT NOT NULL,
  role_in_project VARCHAR(100),

  CONSTRAINT pk_project_members
    PRIMARY KEY (project_id, user_id),

  CONSTRAINT fk_project_members_project
    FOREIGN KEY (project_id) REFERENCES core.projects (id)
    ON DELETE CASCADE,

  CONSTRAINT fk_project_members_user
    FOREIGN KEY (user_id) REFERENCES core.users (id)
    ON DELETE CASCADE
);