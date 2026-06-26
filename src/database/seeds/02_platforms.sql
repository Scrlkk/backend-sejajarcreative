INSERT INTO core.platforms (platform_name, color_key) VALUES
  ('Instagram', 'pink'),
  ('TikTok', 'violet'),
  ('YouTube', 'red')
ON CONFLICT (platform_name) DO NOTHING;

INSERT INTO core.content_category (type_name) VALUES
  ('BTS'),
  ('Tutorial'),
  ('Product Demo'),
  ('Challenge'),
  ('Review'),
  ('Interview'),
  ('Announcement')
ON CONFLICT (type_name) DO NOTHING;

INSERT INTO core.pillars (pillar_name, description) VALUES
  ('Entertainment', 'Konten ringan dan menghibur untuk meningkatkan engagement'),
  ('Education', 'Konten yang mendidik audiens tentang topik relevan di industri'),
  ('Lifestyle', 'Konten gaya hidup dan keseharian'),
  ('Promotion', 'Konten yang mempromosikan produk, layanan, atau penawaran khusus'),
  ('News', 'Konten berita dan update terkini'),
  ('Technology', 'Konten seputar teknologi dan inovasi')
ON CONFLICT (pillar_name) DO NOTHING;
