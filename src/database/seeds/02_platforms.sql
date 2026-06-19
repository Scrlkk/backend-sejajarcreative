INSERT INTO core.platforms (platform_name) VALUES
  ('Instagram'),
  ('TikTok'),
  ('YouTube')
ON CONFLICT (platform_name) DO NOTHING;

INSERT INTO core.content_category (type_name) VALUES
  ('BTS'),
  ('tutorial'),
  ('product_demo'),
  ('challenge'),
  ('review'),
  ('interview'),
  ('announcement')
ON CONFLICT (type_name) DO NOTHING;

INSERT INTO core.pillars (pillar_name, description) VALUES
  ('Entertainment', 'Konten ringan dan menghibur untuk meningkatkan engagement'),
  ('Education', 'Konten yang mendidik audiens tentang topik relevan di industri'),
  ('Lifestyle', 'Konten gaya hidup dan keseharian'),
  ('Promotion', 'Konten yang mempromosikan produk, layanan, atau penawaran khusus'),
  ('News', 'Konten berita dan update terkini'),
  ('Technology', 'Konten seputar teknologi dan inovasi'),
  ('Business', 'Konten bisnis dan kewirausahaan'),
  ('Health', 'Konten kesehatan dan kesejahteraan'),
  ('Sports', 'Konten olahraga dan aktivitas fisik'),
  ('Finance', 'Konten keuangan dan investasi'),
  ('Travel', 'Konten perjalanan dan wisata'),
  ('Food', 'Konten kuliner dan makanan')
ON CONFLICT (pillar_name) DO NOTHING;
INSERT INTO core.platforms (platform_name) VALUES
  ('Instagram'),
  ('TikTok'),
  ('YouTube'),
  ('Twitter/X'),
  ('LinkedIn'),
  ('Facebook'),
  ('Threads'),
  ('Pinterest')
ON CONFLICT (platform_name) DO NOTHING;

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
ON CONFLICT (type_name) DO NOTHING;

INSERT INTO core.pillars (pillar_name, description) VALUES
  ('Edukasi', 'Konten yang mendidik audiens tentang topik relevan di industri'),
  ('Hiburan', 'Konten ringan dan menghibur untuk meningkatkan engagement'),
  ('Promosi', 'Konten yang mempromosikan produk, layanan, atau penawaran khusus'),
  ('Inspirasi', 'Konten motivasi dan kisah sukses untuk menginspirasi audiens'),
  ('Komunitas', 'Konten berbasis interaksi untuk membangun komunitas yang loyal'),
  ('Behind The Scene', 'Konten yang memperlihatkan proses kerja dan suasana tim'),
  ('Testimoni', 'Konten ulasan dan pengalaman nyata dari klien atau pelanggan')
ON CONFLICT (pillar_name) DO NOTHING;
