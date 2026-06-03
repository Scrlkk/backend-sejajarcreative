-- Password semua akun: Admin@12345

INSERT INTO core.users (full_name, email, password) VALUES
  ('Super Admin', 'superadmin@sejajar.id', '$2b$10$A5wU1yoYCwDHMomBu2ftEeGgHhCToCDqjbg.5HbToEnjGqSi7Uc7K'),
  ('Owner Sejajar', 'owner@sejajar.id', '$2b$10$A5wU1yoYCwDHMomBu2ftEeGgHhCToCDqjbg.5HbToEnjGqSi7Uc7K'),
  ('Content Lead', 'contentlead@sejajar.id', '$2b$10$A5wU1yoYCwDHMomBu2ftEeGgHhCToCDqjbg.5HbToEnjGqSi7Uc7K'),
  ('Content Editor', 'editor@sejajar.id', '$2b$10$A5wU1yoYCwDHMomBu2ftEeGgHhCToCDqjbg.5HbToEnjGqSi7Uc7K'),
  ('Script Writer', 'writer@sejajar.id', '$2b$10$A5wU1yoYCwDHMomBu2ftEeGgHhCToCDqjbg.5HbToEnjGqSi7Uc7K'),
  ('Admin Sosmed', 'sosmed@sejajar.id', '$2b$10$A5wU1yoYCwDHMomBu2ftEeGgHhCToCDqjbg.5HbToEnjGqSi7Uc7K')
ON CONFLICT (email) DO NOTHING;

INSERT INTO core.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM core.users u
JOIN (VALUES
  ('superadmin@sejajar.id', 'superadmin'),
  ('owner@sejajar.id', 'owner'),
  ('contentlead@sejajar.id', 'content_lead'),
  ('editor@sejajar.id', 'content_editor'),
  ('writer@sejajar.id', 'script_writer'),
  ('sosmed@sejajar.id', 'admin_social_media')
) AS v(email, role_name) ON u.email = v.email
JOIN core.roles r ON r.role_name = v.role_name
ON CONFLICT (user_id, role_id) DO NOTHING;
