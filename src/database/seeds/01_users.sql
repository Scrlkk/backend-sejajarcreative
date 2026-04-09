-- ─────────────────────────────────────────────────────────────────
-- Seed: Default users
-- Password semua akun: Admin@12345
-- Hash bcrypt rounds=10:
--   $2b$10$A5wU1yoYCwDHMomBu2ftEeGgHhCToCDqjbg.5HbToEnjGqSi7Uc7K
-- ─────────────────────────────────────────────────────────────────

INSERT INTO core.users (full_name, email, password, role) VALUES

  -- Superadmin
  (
    'Super Admin',
    'superadmin@sejajar.id',
    '$2b$10$A5wU1yoYCwDHMomBu2ftEeGgHhCToCDqjbg.5HbToEnjGqSi7Uc7K',
    'superadmin'
  ),

  -- Owner
  (
    'Owner Sejajar',
    'owner@sejajar.id',
    '$2b$10$A5wU1yoYCwDHMomBu2ftEeGgHhCToCDqjbg.5HbToEnjGqSi7Uc7K',
    'owner'
  ),

  -- Content Lead
  (
    'Content Lead',
    'contentlead@sejajar.id',
    '$2b$10$A5wU1yoYCwDHMomBu2ftEeGgHhCToCDqjbg.5HbToEnjGqSi7Uc7K',
    'content_lead'
  ),

  -- Content Editor
  (
    'Content Editor',
    'editor@sejajar.id',
    '$2b$10$A5wU1yoYCwDHMomBu2ftEeGgHhCToCDqjbg.5HbToEnjGqSi7Uc7K',
    'content_editor'
  ),

  -- Script Writer
  (
    'Script Writer',
    'writer@sejajar.id',
    '$2b$10$A5wU1yoYCwDHMomBu2ftEeGgHhCToCDqjbg.5HbToEnjGqSi7Uc7K',
    'script_writer'
  ),

  -- Admin Social Media
  (
    'Admin Sosmed',
    'sosmed@sejajar.id',
    '$2b$10$A5wU1yoYCwDHMomBu2ftEeGgHhCToCDqjbg.5HbToEnjGqSi7Uc7K',
    'admin_social_media'
  )

ON CONFLICT (email) DO NOTHING;