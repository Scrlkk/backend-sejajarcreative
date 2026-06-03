INSERT INTO core.roles (role_name) VALUES
  ('superadmin'),
  ('owner'),
  ('content_lead'),
  ('content_editor'),
  ('script_writer'),
  ('admin_social_media')
ON CONFLICT (role_name) DO NOTHING;
