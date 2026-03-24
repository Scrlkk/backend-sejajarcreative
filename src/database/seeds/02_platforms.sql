-- ─────────────────────────────────────────────────────────────────
-- Seed: Platforms & Content Types & Content Pillars
-- ─────────────────────────────────────────────────────────────────

-- Platforms
INSERT INTO core.platforms (platform_name) VALUES
  ('Instagram'),
  ('TikTok'),
  ('YouTube'),
  ('Twitter/X'),
  ('LinkedIn'),
  ('Facebook'),
  ('Threads'),
  ('Pinterest')
ON CONFLICT DO NOTHING;

-- Content Types
INSERT INTO core.content_types (type_name) VALUES
  ('Feed Post'),
  ('Reels'),
  ('Story'),
  ('Carousel'),
  ('Short Video'),
  ('Long Video'),
  ('Thread'),
  ('Podcast'),
  ('Infografis'),
  ('Blog Post')
ON CONFLICT DO NOTHING;

-- Content Pillars
INSERT INTO core.content_pillars (pillar_name, description) VALUES
  (
    'Edukasi',
    'Konten yang mendidik audiens tentang topik relevan di industri'
  ),
  (
    'Hiburan',
    'Konten ringan dan menghibur untuk meningkatkan engagement'
  ),
  (
    'Promosi',
    'Konten yang mempromosikan produk, layanan, atau penawaran khusus'
  ),
  (
    'Inspirasi',
    'Konten motivasi dan kisah sukses untuk menginspirasi audiens'
  ),
  (
    'Komunitas',
    'Konten berbasis interaksi untuk membangun komunitas yang loyal'
  ),
  (
    'Behind The Scene',
    'Konten yang memperlihatkan proses kerja dan suasana tim'
  ),
  (
    'Testimoni',
    'Konten ulasan dan pengalaman nyata dari klien atau pelanggan'
  )
ON CONFLICT DO NOTHING;

-- Sample Client
INSERT INTO core.clients (client_name, company_name, contact_email, contact_phone) VALUES
  (
    'Budi Santoso',
    'PT Maju Bersama',
    'budi@majubersama.co.id',
    '081234567890'
  ),
  (
    'Siti Rahayu',
    'CV Kreatif Nusantara',
    'siti@kreatiif.id',
    '082345678901'
  )
ON CONFLICT DO NOTHING;