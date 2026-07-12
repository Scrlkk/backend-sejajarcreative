-- Password semua akun: Admin@12345

INSERT INTO core.users (full_name, email, password) VALUES
  ('Kang Jim', 'superadmin@sejajar.id', '$2b$10$A5wU1yoYCwDHMomBu2ftEeGgHhCToCDqjbg.5HbToEnjGqSi7Uc7K'),
  ('Mr. Cheng', 'owner@sejajar.id', '$2b$10$A5wU1yoYCwDHMomBu2ftEeGgHhCToCDqjbg.5HbToEnjGqSi7Uc7K'),
  ('John Joestar', 'contentlead@sejajar.id', '$2b$10$A5wU1yoYCwDHMomBu2ftEeGgHhCToCDqjbg.5HbToEnjGqSi7Uc7K'),
  ('Harry Kane', 'editor@sejajar.id', '$2b$10$A5wU1yoYCwDHMomBu2ftEeGgHhCToCDqjbg.5HbToEnjGqSi7Uc7K'),
  ('Jack Do', 'writer@sejajar.id', '$2b$10$A5wU1yoYCwDHMomBu2ftEeGgHhCToCDqjbg.5HbToEnjGqSi7Uc7K'),
  ('Hadi Lukas', 'sosmed@sejajar.id', '$2b$10$A5wU1yoYCwDHMomBu2ftEeGgHhCToCDqjbg.5HbToEnjGqSi7Uc7K')
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

INSERT INTO core.clients (client_name, company_name, contact_email, contact_phone)
SELECT 'Budi Santoso', 'FreshBrew Coffee', 'budi@freshbrew.com', '08123456789'
WHERE NOT EXISTS (
  SELECT 1 FROM core.clients WHERE company_name = 'FreshBrew Coffee'
);
