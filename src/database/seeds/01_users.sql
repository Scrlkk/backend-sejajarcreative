-- ─────────────────────────────────────────────────────────────────
-- Seed: Default users
-- Password semua akun: Admin@12345
-- Hash bcrypt rounds=10:
--   $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
--
-- PENTING: Ganti password segera setelah login pertama di production
-- ─────────────────────────────────────────────────────────────────

INSERT INTO core.users (full_name, email, password, role) VALUES

  -- Superadmin
  (
    'Super Admin',
    'superadmin@sejajar.id',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'superadmin'
  ),

  -- Owner
  (
    'Owner Sejajar',
    'owner@sejajar.id',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'owner'
  ),

  -- Content Lead
  (
    'Content Lead',
    'contentlead@sejajar.id',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'content_lead'
  ),

  -- Content Editor
  (
    'Content Editor',
    'editor@sejajar.id',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'content_editor'
  ),

  -- Script Writer
  (
    'Script Writer',
    'writer@sejajar.id',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'script_writer'
  ),

  -- Admin Social Media
  (
    'Admin Sosmed',
    'sosmed@sejajar.id',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin_social_media'
  )

ON CONFLICT (email) DO NOTHING;